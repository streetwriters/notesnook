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

export class ChunkDistributor {
  /**
   * @typedef {{length: number, data: Uint8Array, final: boolean}} Chunk
   */
  constructor(chunkSize) {
    this.chunkSize = chunkSize;
    this.chunks = [];
    this.filledCount = 0;
    this.done = false;
  }

  /**
   * @returns {Chunk}
   */
  get lastChunk() {
    return this.chunks[this.chunks.length - 1];
  }

  /**
   * @returns {boolean}
   */
  get isLastChunkFilled() {
    return this.lastChunk.length === this.chunkSize;
  }

  /**
   * @returns {Chunk}
   */
  get firstChunk() {
    const chunk = this.chunks.shift();
    if (chunk.data.length === this.chunkSize) this.filledCount--;
    return chunk;
  }

  close() {
    if (!this.lastChunk)
      throw new Error("No data available in this distributor.");
    this.lastChunk.data = this.lastChunk.data.slice(0, this.lastChunk.length);
    this.lastChunk.final = true;
    this.done = true;
  }

  /**
   * @param {Uint8Array} data
   */
  fill(data) {
    if (this.done || !data || !data.length) return;

    const dataLength = data.length;
    const totalBlocks = Math.ceil(dataLength / this.chunkSize);

    for (let i = 0; i < totalBlocks; ++i) {
      const start = i * this.chunkSize;

      if (this.lastChunk && !this.isLastChunkFilled) {
        const needed = this.chunkSize - this.lastChunk.length;
        const end = Math.min(start + needed, dataLength);
        const chunk = data.slice(start, end);

        this.lastChunk.data.set(chunk, this.lastChunk.length);
        this.lastChunk.length += chunk.length;

        if (this.lastChunk.length === this.chunkSize) this.filledCount++;

        if (end !== dataLength) {
          this.fill(data.slice(end));
          break;
        }
      } else {
        const end = Math.min(start + this.chunkSize, dataLength);
        let chunk = data.slice(start, end);

        const buffer = new Uint8Array(this.chunkSize);
        buffer.set(chunk, 0);

        this.chunks.push({ data: buffer, final: false, length: chunk.length });
        if (chunk.length === this.chunkSize) this.filledCount++;
      }
    }
  }
}
