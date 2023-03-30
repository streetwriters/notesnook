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

import { Zip, ZipDeflate } from "fflate";

export type ZipFile = { path: string; data: Uint8Array };
export class ZipStream extends TransformStream<ZipFile, Uint8Array> {
  constructor() {
    const zipper = new Zip();
    super({
      start(controller) {
        zipper.ondata = (err, data) => {
          if (err) controller.error(err);
          else controller.enqueue(data);
        };
      },
      transform(chunk) {
        const fileStream = new ZipDeflate(chunk.path, {
          level: 5,
          mem: 8
        });
        zipper.add(fileStream);
        fileStream.push(chunk.data, true);
      },
      flush() {
        zipper.end();
      }
    });
  }
}
