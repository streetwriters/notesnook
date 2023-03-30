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

import { Chunk } from "@notesnook/crypto/dist/src/types";
import FileStreamSource from "./filestreamsource";
import { File } from "./types";

export default class FileHandle extends ReadableStream<Chunk> {
  private storage: LocalForage;
  private file: File;

  constructor(storage: LocalForage, file: File) {
    super(new FileStreamSource(storage, file));

    this.file = file;
    this.storage = storage;
  }

  /**
   *
   * @param {Uint8Array} chunk
   */
  async write(chunk: Uint8Array) {
    await this.storage.setItem(this.getChunkKey(this.file.chunks++), chunk);
    await this.storage.setItem(this.file.filename, this.file);
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
