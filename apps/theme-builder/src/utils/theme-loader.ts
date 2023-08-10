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

import { ThemeDefinition, validateTheme } from "@notesnook/theme";
import { tryParse } from "@notesnook/web/src/utils/parse";

export async function loadThemeFromPullRequest(id: string) {
  try {
    //streetwriters/notesnook-themes/3
    const [owner, repo, pullRequestNumber] = id.split("/");
    console.log(owner, repo, pullRequestNumber);
    if (
      !owner ||
      !repo ||
      !pullRequestNumber ||
      owner !== "streetwriters" ||
      repo !== "notesnook-themes" ||
      isNaN(parseInt(pullRequestNumber))
    )
      return null;

    const files = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/files`
    ).then((res) => (res.ok ? res.json() : []));
    if (!files || !Array.isArray(files)) return null;

    for (const file of files) {
      if (file.filename?.endsWith("theme.json") && file.raw_url) {
        return loadThemeFromURL(file.raw_url);
      }
    }
    return null;
  } catch (ex) {
    console.error(ex);
    return null;
  }
}

export async function loadThemeFromURL(url: string) {
  try {
    return loadThemeFromJSON(
      await fetch(`https://cors.notesnook.com/${url}`).then((res) => res.json())
    );
  } catch (err) {
    console.error(err);
    return null;
  }
}

export function loadThemeFromBase64(base64: string) {
  return loadThemeFromJSON(
    tryParse(Buffer.from(base64, "base64url").toString("utf-8"))
  );
}

export function loadThemeFromJSON(themeJSON: any) {
  const result = validateTheme(themeJSON);
  if (result.error) return null;
  return themeJSON as ThemeDefinition;
}
