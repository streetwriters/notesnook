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

import { readFile, writeFile } from "node:fs/promises";

export async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    return (JSON.parse(await readFile(key, "utf-8")) as T) || fallback;
  } catch (e) {
    // console.error(e);
    return fallback;
  }
}

export async function write<T>(key: string, data: T) {
  await writeFile(key, JSON.stringify(data));
}
