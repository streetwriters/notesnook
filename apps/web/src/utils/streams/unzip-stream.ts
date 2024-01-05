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

import { Deflate, Inflate } from "./fflate-shim";
import {
  Entry,
  TextWriter,
  Uint8ArrayWriter,
  ZipReader,
  configure
} from "@zip.js/zip.js";

configure({ Deflate, Inflate });

export async function* createUnzipIterator(file: File) {
  const reader = new ZipReader(file.stream());
  for await (const entry of reader.getEntriesGenerator()) {
    yield new ZipEntry(entry);
  }
  await reader.close();
}

export class ZipEntry extends Blob {
  private ts = new TransformStream();
  constructor(public readonly entry: Entry) {
    super();
  }

  stream(): ReadableStream<Uint8Array> {
    this.entry.getData?.(this.ts.writable);
    return this.ts.readable;
  }

  async text(): Promise<string> {
    const writer = new TextWriter("utf-8");
    await this.entry.getData?.(writer);
    return await writer.getData();
  }

  get size() {
    return this.entry.uncompressedSize;
  }

  get name() {
    return this.entry.filename;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const writer = new Uint8ArrayWriter();
    await this.entry.getData?.(writer);
    return (await writer.getData()).buffer;
  }

  slice(
    _start?: number | undefined,
    _end?: number | undefined,
    _contentType?: string | undefined
  ): Blob {
    throw new Error("Slice is not supported.");
  }
}
