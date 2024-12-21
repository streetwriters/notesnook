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

import fg from "fast-glob";
import { Font } from "fonteditor-core";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import Listr from "listr";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const EXTRA_ICON_NAMES = [
  "menu",
  "lock-open-outline",
  "key-outline",
  "pin-off-outline",
  "pin-outline",
  "star-off",
  "star-outline",
  "link-variant-remove",
  "link-variant",
  "link-variant-off",
  "bell",
  "bell-off-outline",
  "check",
  "magnify",
  "plus",
  "view-list-outline",
  "view-list",
  "tab-plus",
  "server",
  "play",
  "pause",
  "notebook-outline",
  "text-short",
  "radiobox-marked",
  "radiobox-blank",
  "sort-descending",
  "information",
  "sort-ascending",
  "alert",
  "arrow-right",
  "bookmark-outline",
  "checkbox-marked",
  "checkbox-blank-outline",
  "unfold-less-horizontal",
  "minus-circle",
  "vibrate",
  "volume-high",
  "checkbox-blank-circle-outline",
  "check-circle-outline",
  "chevron-up",
  "chevron-down",
  "calendar",
  "minus-circle-outline",
  "close-circle-outline",
  "qrcode",
  "text",
  "cloud",
  "restore",
  "keyboard",
  "numeric",
  "vector-link",
  "notebook-plus",
  "arrow-right-bold-box-outline",
  "arrow-up-bold",
  "login",
  "gift"
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(path.join(__dirname, ".."));
const GLYPH_MAP_PATH = path.join(
  ROOT_DIR,
  "node_modules",
  "react-native-vector-icons",
  "glyphmaps",
  "MaterialCommunityIcons.json"
);
const GLYPH_MAP_OLD_PATH = path.join(
  ROOT_DIR,
  "node_modules",
  "react-native-vector-icons",
  "glyphmaps",
  "MaterialCommunityIcons.old.json"
);

const ICON_FONT_PATH = path.join(
  ROOT_DIR,
  "node_modules",
  "react-native-vector-icons",
  "Fonts",
  "MaterialCommunityIcons.ttf"
);

if (!existsSync(GLYPH_MAP_OLD_PATH) && !existsSync(GLYPH_MAP_PATH))
  throw new Error("Glyph file not found.");

if (!existsSync(GLYPH_MAP_OLD_PATH)) {
  await writeFile(
    GLYPH_MAP_OLD_PATH,
    await readFile(GLYPH_MAP_PATH, "utf-8"),
    "utf-8"
  );
}

const glyphs = JSON.parse(await readFile(GLYPH_MAP_OLD_PATH, "utf-8"));
const files = await fg("app/**/*.{js,jsx,ts,tsx}");
const pattern = /.name="(.+?)"/gm;

const glyphCodepoints = new Set();

class SilentRenderer {
  static get nonTTY() {
    return true;
  }

  render() {}

  end() {}
}
const MODIFIED_GLYPH_MAP = {};

const tasks = new Listr([], {
  concurrent: os.cpus().length,
  renderer: SilentRenderer
});
for (const filePath of files) {
  tasks.add({
    title: `Searching ${filePath}`,
    task: async () => {
      const file = await readFile(filePath, "utf-8");
      const matches = [
        ...file.matchAll(pattern),
        ...file.matchAll(/.icon: "(.+?)"/gm)
      ];
      const icons = matches
        .map((m) => m[1])
        .filter((value) => value !== null && value !== undefined);
      icons.push(...EXTRA_ICON_NAMES);

      for (const icon of icons) {
        if (!glyphs[icon]) continue;
        MODIFIED_GLYPH_MAP[icon] = glyphs[icon];
        glyphCodepoints.add(glyphs[icon]);
      }
    }
  });
}

await tasks.run();
const font = Font.create(await readFile(ICON_FONT_PATH), {
  type: "ttf",
  subset: Array.from(glyphCodepoints.values()),
  hinting: true
});

if (!existsSync(path.join(ROOT_DIR, "native", "fonts"))) {
  await mkdir(path.join(ROOT_DIR, "native", "fonts"));
}

await writeFile(
  path.join(ROOT_DIR, "native", "fonts", "MaterialCommunityIcons.ttf"),
  font.write({ type: "ttf", hinting: true })
);

await writeFile(GLYPH_MAP_PATH, JSON.stringify(MODIFIED_GLYPH_MAP), "utf-8");
