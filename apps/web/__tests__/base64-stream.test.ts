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
import { Base64DecoderStream } from "../src/utils/streams/base64-decoder-stream";
import { consumeReadableStream } from "../src/utils/stream";
import { createReadStream, readFileSync } from "fs";
import { Readable } from "stream";
import path from "path";

test("streamed base64 decoder should output same as non-streamed", async (t) => {
  const expected = readFileSync(
    path.join(__dirname, "..", "__e2e__", "data", "importer-data.zip"),
    "base64"
  );
  const fileStream = Readable.toWeb(
    createReadStream(
      path.join(__dirname, "..", "__e2e__", "data", "importer-data.zip")
    )
  ) as ReadableStream<Uint8Array>;

  t.expect(
    (
      await consumeReadableStream(
        fileStream.pipeThrough(new Base64DecoderStream("base64"))
      )
    ).join("")
  ).toBe(expected);
});
