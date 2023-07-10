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
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import {
  THEME_METADATA_JSON,
  THEMES_REPO_URL,
  THEME_REPO_DIR_NAME
} from "./constants";
import { insert } from "@orama/orama";
import { getDB } from "./orama";
import { ThemeDefinition } from "@notesnook/theme";

let THEME_METADATA_CACHE = [];

const readDirAsync = util.promisify(fs.readdir);
const writeAsync = util.promisify(fs.writeFile);

export async function syncThemes() {
  if (!fs.existsSync(path.join(__dirname, THEME_REPO_DIR_NAME))) {
    execSync(`git clone ${THEMES_REPO_URL}`, {
      stdio: [0, 1, 2],
      cwd: path.resolve(__dirname, "")
    });
    console.log(`Cloned github repo to path ${THEME_REPO_DIR_NAME}`);
  } else {
    execSync(`git pull`, {
      stdio: [0, 1, 2],
      cwd: path.resolve(__dirname, THEME_REPO_DIR_NAME)
    });
    console.log(`Synced github repo ${THEMES_REPO_URL}`);
  }
  generateMetadataJson();
}

async function generateMetadataJson() {
  const THEMES_PATH = path.join(__dirname, THEME_REPO_DIR_NAME, "generated");
  const files = await readDirAsync(THEMES_PATH);
  const ThemesMetadata = [];
  const db = await getDB(true);

  for (const file of files) {
    const themeMetadataPath = `${THEMES_PATH}/${file}/theme.json`;
    const metadata = JSON.parse(
      fs.readFileSync(themeMetadataPath, "utf-8")
    ) as ThemeDefinition;
    const { background, accent, shade, heading, paragraph } =
      metadata.scopes.base.primary;

    const previewColors = {
      background,
      accent,
      shade,
      heading,
      paragraph,
      secondaryBackground: metadata.scopes.base.secondary.background
    };
    metadata.previewColors = previewColors;
    delete metadata.scopes;
    delete metadata.codeBlockCSS;
    ThemesMetadata.push(metadata);
    await insert(db, metadata);
  }
  THEME_METADATA_CACHE = ThemesMetadata;
  await writeAsync(
    THEME_METADATA_JSON,
    JSON.stringify(ThemesMetadata),
    "utf-8"
  );
}

export function getThemesMetadata() {
  return THEME_METADATA_CACHE;
}
