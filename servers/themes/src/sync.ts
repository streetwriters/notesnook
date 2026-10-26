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
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "node:fs";
import { readdir, readFile, rm } from "fs/promises";
import path from "path";
import {
  InstallsCounter,
  THEMES_REPO_URL,
  THEME_REPO_DIR_PATH
} from "./constants";
import { insertMultiple } from "@orama/orama";
import { createDatabase, setDatabase } from "./orama";
import {
  ThemeCompatibilityVersion,
  ThemeDefinition,
  PreviewColors,
  getPreviewColors
} from "@notesnook/theme";

export type CompiledThemeDefinition = ThemeDefinition & {
  sourceURL?: string;
  totalInstalls?: number;
  previewColors: PreviewColors;
};

export type ThemeMetadata = Omit<
  CompiledThemeDefinition,
  "scopes" | "codeBlockCSS"
>;

const THEME_COMPATIBILITY_VERSIONS: ThemeCompatibilityVersion[] = [1];

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT = 60 * 1000;
let currentSync: Promise<void> | undefined;
let isCurrentSyncFull = false;

export function syncThemes(onlyIfChanged = false): Promise<void> {
  // concurrent git pulls fail on index.lock, so piggyback on the running sync
  if (currentSync) {
    if (onlyIfChanged || isCurrentSyncFull) return currentSync;
    // the running check-only sync may skip the rebuild, so queue a full one
    return currentSync.catch(() => {}).then(() => syncThemes());
  }
  isCurrentSyncFull = !onlyIfChanged;
  currentSync = sync(onlyIfChanged).finally(() => (currentSync = undefined));
  return currentSync;
}

async function git(args: string[], cwd: string) {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    timeout: GIT_TIMEOUT
  });
  return stdout.trim();
}

async function hasUpstreamChanges() {
  const [remote, local] = await Promise.all([
    git(["ls-remote", "origin", "HEAD"], THEME_REPO_DIR_PATH),
    git(["rev-parse", "HEAD"], THEME_REPO_DIR_PATH)
  ]);
  return remote.split(/\s/)[0] !== local;
}

// a failed clone/pull can leave the repo unusable (e.g. index.lock), so re-clone next time
async function resetOnFailure(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (e) {
    await rm(THEME_REPO_DIR_PATH, { recursive: true, force: true });
    throw e;
  }
}

async function sync(onlyIfChanged: boolean) {
  if (!fs.existsSync(THEME_REPO_DIR_PATH)) {
    await resetOnFailure(
      git(
        ["clone", "--quiet", THEMES_REPO_URL],
        path.dirname(THEME_REPO_DIR_PATH)
      )
    );
    console.log(`Cloned github repo to path ${THEME_REPO_DIR_PATH}`);
  } else {
    if (onlyIfChanged && !(await hasUpstreamChanges())) return;
    await resetOnFailure(git(["pull", "--quiet"], THEME_REPO_DIR_PATH));
    console.log(`Synced github repo ${THEMES_REPO_URL}`);
  }
  await generateThemesMetadata();
}

async function generateThemesMetadata() {
  const themeDefinitions: CompiledThemeDefinition[] = [];
  const db = await createDatabase();

  const THEMES_PATH = path.join(THEME_REPO_DIR_PATH, "themes");
  const themes = await readdir(THEMES_PATH);

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

      themeDefinitions.push({
        ...theme,
        sourceURL: `https://github.com/streetwriters/notesnook-themes/tree/main/themes/${themeId}/v${version}/`,
        codeBlockCSS,
        totalInstalls: 0,
        previewColors: getPreviewColors(theme)
      });
    }
  }
  const installs = await InstallsCounter.counts(
    themeDefinitions.map((t) => t.id)
  );
  for (const theme of themeDefinitions) {
    theme.totalInstalls = installs[theme.id] || 0;
  }
  await insertMultiple(db, themeDefinitions);
  setDatabase(db);
  console.log("Metadata generated and cached.");
}
