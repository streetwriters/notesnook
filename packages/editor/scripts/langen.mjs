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

/**
 * Quick & dirty script to download & transform all language details from
 * the PrismJS repo.
 */

import fs from "fs";
import path from "path";

export async function langen(rootDirectory) {
  const response = await fetch(
    "https://github.com/PrismJS/prism/raw/master/components.json"
  );
  if (!response.ok) return {};

  const json = await response.json();
  let languages = [];
  for (const key in json.languages) {
    if (key === "meta") continue;
    const language = json.languages[key];

    const languagePath = path.join(
      rootDirectory,
      "node_modules",
      "refractor",
      "lang",
      `${key}.js`
    );
    if (!fs.existsSync(languagePath)) continue;

    languages.push({
      filename: key,
      title: language.title,
      alias: language.alias
        ? Array.isArray(language.alias)
          ? language.alias
          : [language.alias]
        : undefined
    });
  }

  const languageIndex = `/* !!! THIS IS A GENERATED FILE. DO NOT EDIT !!! */
export async function loadLanguage(language: string) {
  switch (language) {
    ${languages
      .map(({ filename, alias }) => {
        return [
          ...(alias || []).map((a) => `case "${a}":`),
          `case "${filename}":`,
          `return await import("refractor/lang/${filename}.js");`
        ].join("\n");
      })
      .join("\n\n")}
  }
}`;

  return { languages, languageIndex };
}
