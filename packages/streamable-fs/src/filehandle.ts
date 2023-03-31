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

import FileStreamSource from "./filestreamsource";
import { File } from "./types";

export default class FileHandle {
  private storage: LocalForage;
  public file: File;

  constructor(storage: LocalForage, file: File) {
    this.file = file;
    this.storage = storage;
  }

  get readable() {
    return new ReadableStream(new FileStreamSource(this.storage, this.file));
  }

  get writeable() {
    return new WritableStream<Uint8Array>({
      write: async (chunk, controller) => {
        if (controller.signal.aborted) return;

        await this.storage.setItem(this.getChunkKey(this.file.chunks++), chunk);
        await this.storage.setItem(this.file.filename, this.file);
      },
      abort: async () => {
        for (let i = 0; i < this.file.chunks; ++i) {
          await this.storage.removeItem(this.getChunkKey(i));
        }
      }
    });
  }

  async addAdditionalData<T>(key: string, value: T) {
    this.file.additionalData = this.file.additionalData || {};
    this.file.additionalData[key] = value;
    await this.storage.setItem(this.file.filename, this.file);
  }

  async delete() {
    for (let i = 0; i < this.file.chunks; ++i) {
      await this.storage.removeItem(this.getChunkKey(i));
    }
    await this.storage.removeItem(this.file.filename);
  }

  private getChunkKey(offset: number): string {
    return `${this.file.filename}-chunk-${offset}`;
  }

  async readChunk(offset: number): Promise<Uint8Array | null> {
    const array = await this.storage.getItem<Uint8Array>(
      this.getChunkKey(offset)
    );
    return array;
  }

  async readChunks(from: number, length: number): Promise<Blob> {
    const blobParts: BlobPart[] = [];
    for (let i = from; i < from + length; ++i) {
      const array = await this.readChunk(i);
      if (!array) continue;
      blobParts.push(array.buffer);
    }
    return new Blob(blobParts, { type: this.file.type });
  }

  async toBlob() {
    const blobParts: BlobPart[] = [];
    for (let i = 0; i < this.file.chunks; ++i) {
      const array = await this.readChunk(i);
      if (!array) continue;
      blobParts.push(array.buffer);
    }
    return new Blob(blobParts, { type: this.file.type });
  }
}
