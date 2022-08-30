/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Syntax } from "refractor";

const loadedLanguages: Record<string, Syntax | undefined> = {};
export function isLanguageLoaded(name: string) {
  return !!loadedLanguages[name];
}
export async function loadLanguage(shortName: string) {
  if (loadedLanguages[shortName]) return loadedLanguages[shortName];

  const url = `https://esm.sh/refractor@4.7.0/lang/${shortName}.js?bundle=true`;
  const result = await loadScript(shortName, url);
  loadedLanguages[shortName] = result;
  return result;
}

async function loadScript(id: string, url: string) {
  return new Promise<Syntax>((resolve) => {
    const callbackName = `on${id}Loaded`;
    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
    import LanguageDefinition from "${url}";
    if (window["${callbackName}"]) {
      window["${callbackName}"](LanguageDefinition)
    }
`;
    (window as unknown as Record<string, unknown>)[callbackName] = (
      lang: Syntax
    ) => {
      script.remove();
      (window as unknown as Record<string, unknown>)[callbackName] = null;

      resolve(lang);
    };

    // Append to the `head` element
    document.head.appendChild(script);
  });
}
