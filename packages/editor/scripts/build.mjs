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

import "isomorphic-fetch";
import path from "path";
import fs from "fs";
import { langen } from "./langen.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(path.join(__dirname, ".."));

const pathsToCopy = {
  "katex.min.css": "node_modules/katex/dist/katex.min.css",
  "fonts/": "node_modules/katex/dist/fonts/"
};

for (const name in pathsToCopy) {
  const src = pathsToCopy[name];
  const fullPath = path.join(ROOT_DIR, src);
  fs.cpSync(fullPath, path.join(ROOT_DIR, "styles", name), {
    force: true,
    recursive: true,
    errorOnExist: false
  });
}

const languagesList = await langen(ROOT_DIR, path.join(ROOT_DIR, "languages"));

fs.writeFileSync(
  path.join(ROOT_DIR, "src", "extensions", "code-block", "languages.json"),
  JSON.stringify(languagesList)
);
