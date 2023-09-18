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

import { BufferPool } from "./buffer-pool";
import { randomBytes, randomInt } from "./random";

const PROCESS_UNIQUE = randomBytes(5);
let index = ~~(randomInt() * 0xffffff);

const objectIdPool = new BufferPool(12);
export function createObjectId(date = Date.now()): string {
  const buffer = objectIdPool.alloc();
  index = (index + 1) % 0xffffff;

  const time = ~~(date / 1000);

  // 4-byte timestamp
  new DataView(buffer.buffer, 0, 4).setUint32(0, time);

  // 5-byte process unique
  buffer[4] = PROCESS_UNIQUE[0];
  buffer[5] = PROCESS_UNIQUE[1];
  buffer[6] = PROCESS_UNIQUE[2];
  buffer[7] = PROCESS_UNIQUE[3];
  buffer[8] = PROCESS_UNIQUE[4];

  // 3-byte counter
  buffer[11] = index & 0xff;
  buffer[10] = (index >> 8) & 0xff;
  buffer[9] = (index >> 16) & 0xff;

  const objectId = buffer.toString("hex");
  objectIdPool.free(buffer);
  return objectId;
}
