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
import { ChunkedStream } from "../src/utils/streams/chunked-stream";
import { Readable } from "stream";
import { createReadStream } from "fs";
import { consumeReadableStream } from "../src/utils/stream";
import { xxhash64 } from "hash-wasm";
import path from "path";

const CHUNK_SIZE = 512 * 1024;
test("chunked stream should create equal sized chunks", async (t) => {
  const chunks = await consumeReadableStream(
    (
      Readable.toWeb(
        createReadStream(
          path.join(__dirname, "..", "__e2e__", "data", "importer-data.zip")
        )
      ) as ReadableStream<Uint8Array>
    ).pipeThrough(new ChunkedStream(CHUNK_SIZE))
  );

  t.expect(await Promise.all(chunks.map((a) => xxhash64(a)))).toMatchObject([
    "6234b76401d9eb97",
    "338834da3f6500b2"
  ]);
});
