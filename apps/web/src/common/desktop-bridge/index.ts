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

import { createWriteStream } from "../../utils/stream-saver";
import { type desktop as bridge } from "./index.desktop";
console.log("NOT DESKTOP!");

export const desktop: typeof bridge | undefined = undefined;
export function createWritableStream(filename: string) {
  return createWriteStream(filename);
}
export const PATHS: Record<string, string> | undefined = undefined;
