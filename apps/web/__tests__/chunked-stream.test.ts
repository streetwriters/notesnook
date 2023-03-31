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

import "./bootstrap";
import { test } from "vitest";
import { ChunkedStream } from "../src/interfaces/chunked-stream";
import { toAsyncIterator } from "@notesnook-importer/core/dist/src/utils/stream";

test("chunked stream should create equal sized chunks", async (t) => {
  const { readable, writable } = new ChunkedStream(512);
  const lengths: number[] = [];

  setTimeout(async () => {
    for await (const chunk of toAsyncIterator(readable)) {
      lengths.push(chunk.length);
    }
  });
  const writer = writable.getWriter();
  await writer.write(Buffer.alloc(411));
  await writer.write(Buffer.alloc(411));
  await writer.write(Buffer.alloc(411));
  await writer.write(Buffer.alloc(815));
  await writer.write(Buffer.alloc(12));
  await writer.close();

  t.expect(lengths).toMatchObject([512, 512, 512, 512, 12]);
});
