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

import { files, type WritableFile } from "@platform";

function toWritableStream(file: WritableFile, signal?: AbortSignal) {
  const stream = new WritableStream<Uint8Array>({
    write: (chunk) => file.write(chunk),
    close: () => file.close(),
    abort: () => file.abort()
  });
  signal?.addEventListener("abort", () => {
    stream.abort().catch(() => {});
  });
  return stream;
}

export async function createWriteStream(
  filename: string,
  options?: { signal?: AbortSignal }
) {
  return toWritableStream(await files.create(filename), options?.signal);
}

export async function createWritableStream(path: string) {
  return toWritableStream(await files.createAt(path));
}

export async function saveBytes(filename: string, data: Uint8Array | string) {
  const file = await files.create(filename);
  await file.write(
    typeof data === "string" ? new TextEncoder().encode(data) : data
  );
  await file.close();
}
