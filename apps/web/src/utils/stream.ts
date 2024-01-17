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
import { toAsyncIterator } from "@notesnook-importer/core/dist/src/utils/stream";

export async function consumeReadableStream<T>(
  stream: ReadableStream<T>
): Promise<T[]> {
  const chunks: T[] = [];
  for await (const chunk of toAsyncIterator(stream)) {
    chunks.push(chunk);
  }
  return chunks;
}

export function fromAsyncIterator<T>(
  iterator: AsyncIterableIterator<T>
): ReadableStream<T> {
  return new ReadableStream<T>({
    start() {},
    async pull(controller) {
      const result = await iterator.next();
      if (result.done) controller.close();
      else if (result.value) controller.enqueue(result.value);
    },
    async cancel(reason) {
      if (iterator.throw) await iterator.throw(reason);
      else throw new Error(reason);
    }
  });
}
