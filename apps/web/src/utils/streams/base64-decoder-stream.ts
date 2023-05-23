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

export class Base64DecoderStream extends TransformStream<Uint8Array, string> {
  constructor(encoding: "base64url" | "base64" = "base64") {
    let backBuffer: Uint8Array | null = null;
    super({
      start() {},
      transform(chunk, controller) {
        let part = backBuffer
          ? Buffer.concat(
              [Buffer.from(backBuffer), Buffer.from(chunk)],
              backBuffer.length + chunk.length
            )
          : Buffer.from(chunk.buffer);

        const remaining = part.length % 3;
        if (remaining) {
          backBuffer = new Uint8Array(remaining);
          for (let i = 0; i < remaining; ++i) {
            backBuffer[i] = part[part.length - remaining + i];
          }
          part = part.subarray(0, part.length - remaining);
        } else {
          backBuffer = null;
        }

        controller.enqueue(toBase64(part, encoding));
      },
      flush(controller) {
        if (backBuffer)
          controller.enqueue(toBase64(Buffer.from(backBuffer), encoding));
      }
    });
  }
}

function toBase64(bytes: Buffer, encoding: "base64url" | "base64") {
  const result = Buffer.isEncoding(encoding)
    ? bytes.toString(encoding)
    : bytes.toString("base64");
  return result;
}
