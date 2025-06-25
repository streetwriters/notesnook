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

import * as Mjs from "@mdi/js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { cp, readFile, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(path.join(__dirname, ".."));
const DIST_DIR = path.resolve(ROOT_DIR, "dist");
const ICONS_MJS_BUNDLE_PATH = path.resolve(
  ROOT_DIR,
  "dist",
  "esm",
  "toolbar",
  "icons.js"
);
const ICONS_CJS_BUNDLE_PATH = path.resolve(
  ROOT_DIR,
  "dist",
  "cjs",
  "toolbar",
  "icons.js"
);

if (
  !fs.existsSync(DIST_DIR) ||
  !fs.existsSync(ICONS_MJS_BUNDLE_PATH) ||
  !fs.existsSync(ICONS_CJS_BUNDLE_PATH)
)
  throw new Error("Please build the editor before running this script.");

for (const bundle of [
  { type: "cjs", path: ICONS_CJS_BUNDLE_PATH },
  { type: "mjs", path: ICONS_MJS_BUNDLE_PATH }
]) {
  console.log("Replacing icons with their path...");

  let ICON_FILE = await readFile(bundle.path, "utf-8");
  const icons =
    bundle.type === "cjs"
      ? ICON_FILE.matchAll(/: .+\.(mdi.+),/g)
      : ICON_FILE.matchAll(/: (mdi.+),/g);
  for (const icon of icons) {
    const iconPath = Mjs[icon[1]];
    if (!iconPath) throw new Error(`Could not find path for icon: ${icon[1]}.`);
    ICON_FILE = ICON_FILE.replace(icon[0], `: "${iconPath}",`);
  }

  console.log("Removing @mdi/js import...");

  ICON_FILE = ICON_FILE.replace(/^import \{.+ } from "@mdi\/js";/gm, "");
  ICON_FILE = ICON_FILE.replace(
    /(var|const|let).+=\s+require\(['"]@mdi\/js['"]\);/gm,
    ""
  );

  console.log("Saving file...");

  await writeFile(bundle.path, ICON_FILE);
}

console.log("copying styles...");

await cp(path.resolve(ROOT_DIR, "styles"), path.resolve(DIST_DIR, "styles"), {
  recursive: true
});

console.log("Done.");
