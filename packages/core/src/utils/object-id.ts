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

import { randomBytes } from "./random";

export class InvalidObjectId extends Error {
  constructor() {
    super();
    this.name = "InvalidObjectId";
    this.message = "Invalid ObjectId length";
  }
}

const PROCESS_UNIQUE = randomBytes(5);
let index = ~~(Math.random() * 0xffffff);

export function objectId(date = Date.now()): Buffer {
  index = (index + 1) % 0xffffff;
  const objectId = new Uint8Array(12);
  const time = ~~(date / 1000);

  // 4-byte timestamp
  new DataView(objectId.buffer, 0, 4).setUint32(0, time);

  // 5-byte process unique
  objectId[4] = PROCESS_UNIQUE[0];
  objectId[5] = PROCESS_UNIQUE[1];
  objectId[6] = PROCESS_UNIQUE[2];
  objectId[7] = PROCESS_UNIQUE[3];
  objectId[8] = PROCESS_UNIQUE[4];

  // 3-byte counter
  objectId[11] = index & 0xff;
  objectId[10] = (index >> 8) & 0xff;
  objectId[9] = (index >> 16) & 0xff;

  return Buffer.from(objectId.buffer);
}

export function isValid(oid: Uint8Array): boolean {
  return oid.length === 12;
}

// export function fromHex(hex: string): Uint8Array {
//   const oid = stdDecodeString(hex);
//   if (!isValid(oid)) throw new InvalidObjectId();
//   return oid;
// }

export function getDate(oid: Uint8Array): Date {
  const date = new Date();
  const time = new DataView(oid.buffer, 0, 4).getUint32(0);

  date.setTime(~~time * 1000);
  return date;
}
