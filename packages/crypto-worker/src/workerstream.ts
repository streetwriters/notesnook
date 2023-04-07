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

import { IStreamable } from "@notesnook/crypto/dist/src/interfaces";
import { Chunk } from "@notesnook/crypto/dist/src/types";
import { sendEventWithResult } from "./utils";

export default class WorkerStream
  extends ReadableStream<Chunk>
  implements IStreamable
{
  private id: string;
  private reader?: ReadableStreamReader<Chunk>;

  constructor(streamId: string) {
    super(new WorkerStreamSource(streamId));
    this.id = streamId;
  }

  async read(): Promise<Chunk | undefined> {
    if (!this.reader) this.reader = this.getReader();
    const { value } = await this.reader.read();
    return value;
  }

  /**
   * @param {Uint8Array} chunk
   */
  async write(chunk: Chunk): Promise<void> {
    if (!chunk.data) return;
    postMessage({ type: `${this.id}:write`, data: chunk }, [chunk.data.buffer]);
  }
}

class WorkerStreamSource implements UnderlyingSource<Chunk> {
  private id: string;
  constructor(streamId: string) {
    this.id = streamId;
  }

  start() {}

  async pull(controller: ReadableStreamController<Chunk>) {
    const chunk = await sendEventWithResult<Chunk>(`${this.id}:read`);
    controller.enqueue(chunk);
    if (chunk.final) controller.close();
  }
}
