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

// Moves React Native prop names to the web API names (see lib.mjs).
//
//   npm run codemod -- <file|dir>...           list what would change
//   npm run codemod -- --write <file|dir>...   rewrite the files
//
// Prints the places it left alone ("manual"). Exits 1 only for a bad path.

import fs from "node:fs";
import path from "node:path";
import { transform } from "./lib.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const targets = args.filter((a) => !a.startsWith("--"));
if (!targets.length) {
  console.error("usage: codemod [--write] <file|dir>...");
  process.exit(1);
}

const files = [];
const walk = (p) => {
  if (!fs.existsSync(p)) {
    console.error(`no such path: ${p}`);
    process.exit(1);
  }
  if (fs.statSync(p).isDirectory()) {
    for (const e of fs.readdirSync(p))
      if (e !== "node_modules") walk(path.join(p, e));
  } else if (/\.(tsx|jsx)$/.test(p)) files.push(p);
};
targets.forEach(walk);

let changed = 0;
for (const file of files) {
  const r = transform(fs.readFileSync(file, "utf8"), file);
  if (r.changed) {
    changed++;
    if (write) fs.writeFileSync(file, r.code);
    console.log(`${write ? "rewrote" : "would rewrite"} ${file}`);
  }
  for (const m of r.manual) console.log(`  manual ${file}:${m.line} ${m.message}`);
}
console.log(
  `${changed} of ${files.length} files ${write ? "rewritten" : "would change"}`
);
