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

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function patchBetterSQLite3() {
  const jsonPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "better-sqlite3-multiple-ciphers",
    "package.json"
  );
  const json = JSON.parse(await readFile(jsonPath, "utf-8"));

  json.version = "11.5.1";
  json.homepage = "https://github.com/thecodrr/better-sqlite3-multiple-ciphers";
  json.repository.url =
    "git://github.com/thecodrr/better-sqlite3-multiple-ciphers.git";

  await writeFile(jsonPath, JSON.stringify(json));
}

if (process.argv[1] === __filename) {
  console.log("Patching better-sqlite3");
  patchBetterSQLite3();
}
