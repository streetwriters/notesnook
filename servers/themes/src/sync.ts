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
import { readdir, readFile } from "fs/promises";
import path from "path";
import {
  InstallsCounter,
  THEMES_REPO_URL,
  THEME_REPO_DIR_PATH
} from "./constants";
import { insertMultiple } from "@orama/orama";
import { initializeDatabase } from "./orama";
import { ThemeCompatibilityVersion, ThemeDefinition } from "@notesnook/theme";

export type CompiledThemeDefinition = ThemeDefinition & {
  totalInstalls: number;
  previewColors: {
    editor: string;
    navigationMenu: { accent: string; background: string; icon: string };
    list: {
      heading: string;
      accent: string;
      background: string;
    };
    statusBar: {
      paragraph: string;
      background: string;
      icon: string;
    };
    border: string;
    paragraph: string;
    background: string;
    accent: string;
  };
};

export type ThemeMetadata = Omit<
  CompiledThemeDefinition,
  "scopes" | "codeBlockCSS"
>;

const THEME_COMPATIBILITY_VERSIONS: ThemeCompatibilityVersion[] = [1];

export async function syncThemes() {
  if (!fs.existsSync(THEME_REPO_DIR_PATH)) {
    execSync(`git clone ${THEMES_REPO_URL}`, {
      stdio: [0, 1, 2],
      cwd: path.dirname(THEME_REPO_DIR_PATH)
    });
    console.log(`Cloned github repo to path ${THEME_REPO_DIR_PATH}`);
  } else {
    execSync(`git pull`, {
      stdio: [0, 1, 2],
      cwd: THEME_REPO_DIR_PATH
    });
    console.log(`Synced github repo ${THEMES_REPO_URL}`);
  }
  await generateThemesMetadata();
}

async function generateThemesMetadata() {
  const themeDefinitions: CompiledThemeDefinition[] = [];
  const db = await initializeDatabase();

  const THEMES_PATH = path.join(THEME_REPO_DIR_PATH, "themes");
  const themes = await readdir(THEMES_PATH);
  const counts = await InstallsCounter.counts();

  for (const themeId of themes) {
    for (const version of THEME_COMPATIBILITY_VERSIONS) {
      const themeDirectory = path.join(THEMES_PATH, themeId, `v${version}`);
      const themeFilePath = path.join(themeDirectory, "theme.json");
      const theme: ThemeDefinition = JSON.parse(
        await readFile(themeFilePath, "utf-8")
      );
      const hasCodeBlockCSS = fs.existsSync(
        path.join(themeDirectory, "code-block.css")
      );
      const codeBlockCSS = await readFile(
        path.join(
          THEMES_PATH,
          hasCodeBlockCSS ? themeId : `default-${theme.colorScheme}`,
          `v${version}`,
          "code-block.css"
        ),
        "utf-8"
      );

      const { base, navigationMenu, statusBar, list, editor } = theme.scopes;
      const { primary, success } = base;

      themeDefinitions.push({
        ...theme,
        codeBlockCSS,
        totalInstalls: counts[theme.id]?.length || 0,
        previewColors: {
          navigationMenu: {
            accent: navigationMenu?.primary?.accent || primary.accent,
            background:
              navigationMenu?.primary?.background || primary.background,
            icon: navigationMenu?.primary?.icon || primary.icon
          },
          statusBar: {
            paragraph: statusBar?.primary?.paragraph || primary.paragraph,
            background: statusBar?.primary?.background || primary.background,
            icon: statusBar?.success?.icon || success.icon
          },
          editor: editor?.primary?.background || primary.background,
          list: {
            heading: list?.primary?.heading || primary.heading,
            background: list?.primary?.background || primary.background,
            accent: list?.primary?.accent || primary.accent
          },
          border: primary.border,
          paragraph: primary.paragraph,
          background: primary.background,
          accent: primary.accent
        }
      });
    }
  }
  await insertMultiple(db, themeDefinitions);
  console.log("Metadata generated and cached.");
}
