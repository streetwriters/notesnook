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

import FileHandle from "./filehandle.js";
import { IFileStorage, IStreamableFS } from "./interfaces.js";
import { File } from "./types.js";
import { chunkPrefix } from "./utils.js";

export class StreamableFS implements IStreamableFS {
  /**
   * @param db name of the indexeddb database
   */
  constructor(private readonly storage: IFileStorage) {}

  async createFile(
    filename: string,
    size: number,
    type: string,
    options?: { overwrite?: boolean }
  ): Promise<FileHandle> {
    const exists = await this.exists(filename);
    if (!options?.overwrite && exists) throw new Error("File already exists.");
    else if (options?.overwrite && exists) await this.deleteFile(filename);

    const file: File = {
      filename,
      size,
      type
    };
    await this.storage.setMetadata(filename, file);
    return new FileHandle(this.storage, file, []);
  }

  async readFile(filename: string): Promise<FileHandle | undefined> {
    const file = await this.storage.getMetadata(filename);
    if (!file) return undefined;
    const chunks = (await this.storage.listChunks(chunkPrefix(filename))).sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true })
    );
    return new FileHandle(this.storage, file, chunks);
  }

  async exists(filename: string): Promise<boolean> {
    const file = await this.storage.getMetadata(filename);
    return !!file;
  }

  async list(): Promise<string[]> {
    return this.storage.list();
  }

  async deleteFile(filename: string): Promise<boolean> {
    const handle = await this.readFile(filename);
    if (!handle) return true;
    await handle.delete();
    return true;
  }

  async moveFile(source: FileHandle, dest: FileHandle) {
    await source.readable.pipeTo(dest.writeable);
    await source.delete();
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}

export type { IFileStorage, File, FileHandle };
