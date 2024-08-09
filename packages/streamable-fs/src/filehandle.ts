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
import { IFileStorage } from "./interfaces";
import { File } from "./types";
import { chunkPrefix } from "./utils";

export default class FileHandle {
  constructor(
    private readonly storage: IFileStorage,
    readonly file: File,
    readonly chunks: string[]
  ) {}

  get readable() {
    return new ReadableStream(
      new FileStreamSource(this.storage, this.file, this.chunks)
    );
  }

  get writeable() {
    return new WritableStream<Uint8Array>({
      write: async (chunk, controller) => {
        if (controller.signal.aborted) return;

        const lastOffset = this.lastOffset();
        await this.storage.writeChunk(this.getChunkKey(lastOffset + 1), chunk);
        this.chunks.push(this.getChunkKey(lastOffset + 1));
      },
      abort: async () => {
        for (const chunk of this.chunks) {
          await this.storage.deleteChunk(chunk);
        }
      }
    });
  }

  async writeChunkAtOffset(offset: number, chunk: Uint8Array) {
    await this.storage.writeChunk(this.getChunkKey(offset), chunk);
  }

  async addAdditionalData<T>(key: string, value: T) {
    this.file.additionalData = this.file.additionalData || {};
    this.file.additionalData[key] = value;
    await this.storage.setMetadata(this.file.filename, this.file);
  }

  async delete() {
    for (const chunk of this.chunks) {
      await this.storage.deleteChunk(chunk);
    }
    await this.storage.deleteMetadata(this.file.filename);
  }

  private getChunkKey(offset: number): string {
    return `${chunkPrefix(this.file.filename)}${offset}`;
  }

  async readChunk(offset: number): Promise<Uint8Array | null> {
    const array = await this.storage.readChunk(this.getChunkKey(offset));
    return array || null;
  }

  async readChunks(from: number, length: number): Promise<Blob> {
    const blobParts: BlobPart[] = [];
    for (let i = from; i < from + length; ++i) {
      const array = await this.readChunk(i);
      if (!array) throw new Error(`No data found for chunk at offset ${i}.`);
      blobParts.push(array.buffer);
    }
    return new Blob(blobParts, { type: this.file.type });
  }

  async toBlob() {
    const blobParts: BlobPart[] = [];
    for (const chunk of this.chunks) {
      const array = await this.storage.readChunk(chunk);
      if (!array) continue;
      blobParts.push(array.buffer);
    }
    return new Blob(blobParts, { type: this.file.type });
  }

  async size() {
    let size = 0;
    for (const chunk of this.chunks) {
      const array = await this.storage.readChunk(chunk);
      if (!array) continue;
      size += array.length;
    }
    return size;
  }

  async listChunks() {
    return (
      await this.storage.listChunks(chunkPrefix(this.file.filename))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  private lastOffset() {
    const lastChunk = this.chunks.at(-1);
    if (!lastChunk) return -1;
    return parseInt(lastChunk.replace(chunkPrefix(this.file.filename), ""));
  }
}
