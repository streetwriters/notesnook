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
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_THEMES = ["default-light", "default-dark"];

const THEMES_DIRECTORY = path.resolve(
  path.join(__dirname, "..", "src", "theme-engine", "themes")
);

const THEME_COMPATIBILITY_VERSION = 1;

async function main() {
  await mkdir(THEMES_DIRECTORY, { recursive: true });

  for (const themeId of DEFAULT_THEMES) {
    console.log("Getting", themeId);

    const BASE_URL = `https://raw.githubusercontent.com/streetwriters/notesnook-themes/main/themes/${themeId}/v${THEME_COMPATIBILITY_VERSION}`;
    const theme = await fetch(`${BASE_URL}/theme.json`).then((r) => r.json());
    const codeBlockCSS = await fetch(`${BASE_URL}/code-block.css`).then((r) =>
      r.text()
    );
    if (!theme) continue;

    await writeFile(
      path.join(THEMES_DIRECTORY, `${themeId}.json`),
      JSON.stringify({ ...theme, $schema: undefined, codeBlockCSS })
    );
  }
}

main();
