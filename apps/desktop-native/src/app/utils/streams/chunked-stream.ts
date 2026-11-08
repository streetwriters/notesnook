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

import { Chunk } from "@notesnook/crypto";

export class ChunkedStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(chunkSize: number, mode: "nocopy" | "copy") {
    let backBuffer: Uint8Array | null = null;
    super({
      start() {},
      transform(chunk, controller) {
        backBuffer = backBuffer
          ? Buffer.concat(
              [Buffer.from(backBuffer), Buffer.from(chunk)],
              backBuffer.length + chunk.length
            )
          : Buffer.from(chunk);

        if (backBuffer.length >= chunkSize) {
          let remainingBytes = backBuffer.length;
          while (remainingBytes >= chunkSize) {
            const start = backBuffer.length - remainingBytes;
            const end = start + chunkSize;

            // TODO: find a way to support sending the chunked
            // buffer to web workers without copying.
            controller.enqueue(
              mode === "copy"
                ? new Uint8Array(backBuffer.buffer.slice(start, end))
                : backBuffer.subarray(start, end)
            );
            remainingBytes -= chunkSize;
          }

          backBuffer =
            remainingBytes > 0
              ? backBuffer.subarray(backBuffer.length - remainingBytes)
              : null;
        }
      },
      flush(controller) {
        if (backBuffer) {
          const buffer =
            mode === "copy" ? new Uint8Array(backBuffer) : backBuffer;
          controller.enqueue(buffer);
        }
      }
    });
  }
}

export class IntoChunks extends TransformStream<Uint8Array, Chunk> {
  constructor(totalSize: number) {
    let size = 0;
    super({
      start() {},
      transform(chunk, controller) {
        size += chunk.length;
        controller.enqueue({ data: chunk, final: size === totalSize });
      }
    });
  }
}
