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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "node_modules");
const link = path.join(root, "../../packages/ui/src/kit/node_modules");

if (!fs.existsSync(target)) process.exit(0);

try {
  fs.rmSync(link, { force: true, recursive: true });
} catch {}
fs.symlinkSync(
  process.platform === "win32"
    ? target
    : path.relative(path.dirname(link), target),
  link,
  process.platform === "win32" ? "junction" : "dir"
);
