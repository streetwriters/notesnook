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

import { File } from "./types.js";
import { IFileStorage } from "./interfaces.js";

export default class FileStreamSource {
  private index = 0;

  constructor(
    private readonly storage: IFileStorage,
    private readonly file: File,
    private readonly chunks: string[]
  ) {}

  start() {}

  async pull(controller: ReadableStreamDefaultController<Uint8Array>) {
    const data = await this.readChunk(this.index++);

    if (data) controller.enqueue(data);

    const isFinalChunk = this.index === this.chunks.length;
    if (isFinalChunk || !data) controller.close();
  }

  private readChunk(index: number) {
    if (index > this.chunks.length) return;
    return this.storage.readChunk(this.chunks[index]);
  }
}
