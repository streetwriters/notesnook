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

import { Unzipped } from "fflate";
import { sanitizeFilename } from "./filename";

const textEncoder = new TextEncoder();
type File = { filename: string; content: string };
async function zip(files: File[], format: string): Promise<Uint8Array> {
  const obj: Unzipped = Object.create(null);
  files.forEach((file) => {
    const name = sanitizeFilename(file.filename);
    let counter = 0;
    while (obj[makeFilename(name, format, counter)]) ++counter;

    obj[makeFilename(name, format, counter)] = textEncoder.encode(file.content);
  });
  const { zipSync } = await import("fflate");
  return zipSync(obj);
}
export { zip };

function makeFilename(filename: string, extension: string, counter: number) {
  let final = filename;
  if (counter) final += `-${counter}`;
  final += `.${extension}`;
  return final;
}
