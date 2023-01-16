/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import localforage from "localforage";
import FileHandle from "./src/filehandle";
import { IStreamableFS } from "./src/interfaces";
import { File } from "./src/types";

export class StreamableFS implements IStreamableFS {
  private storage: LocalForage;

  /**
   * @param db name of the indexeddb database
   */
  constructor(db: string) {
    this.storage = localforage.createInstance({
      storeName: "streamable-fs",
      name: db,
      driver: [localforage.INDEXEDDB]
    });
  }

  async createFile(
    filename: string,
    size: number,
    type: string
  ): Promise<FileHandle> {
    if (await this.exists(filename)) throw new Error("File already exists.");

    const file: File = await this.storage.setItem<File>(filename, {
      filename,
      size,
      type,
      chunks: 0
    });
    return new FileHandle(this.storage, file);
  }

  async readFile(filename: string): Promise<FileHandle | undefined> {
    const file = await this.storage.getItem<File>(filename);
    if (!file) return undefined;
    return new FileHandle(this.storage, file);
  }

  async exists(filename: string): Promise<boolean> {
    const file = await this.storage.getItem<File>(filename);
    return !!file;
  }

  async deleteFile(filename: string): Promise<boolean> {
    const handle = await this.readFile(filename);
    if (!handle) return true;
    await handle.delete();
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}
