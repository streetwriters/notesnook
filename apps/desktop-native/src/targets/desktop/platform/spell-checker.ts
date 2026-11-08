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

import {
  check,
  forget,
  getLanguages,
  getLearnedWords,
  ignore,
  learn,
  suggest
} from "@react-native-gpui/spellcheck";
import type { Language, SpellChecker } from "../../../platform";
import { config } from "./config";

const ENABLED = "spellCheckerEnabled";
const LANGUAGES = "spellCheckerLanguages";

async function enabledCodes() {
  const stored = config.get<string[] | undefined>(LANGUAGES, undefined);
  if (stored && stored.length > 0) return stored;
  const all = await getLanguages();
  return all.length > 0 ? [all[0].code] : [];
}

export const spellChecker: SpellChecker = {
  isEnabled: async () => config.get<boolean>(ENABLED, true),
  async setEnabled(enabled) {
    config.set(ENABLED, enabled);
  },
  getLanguages: () => getLanguages() as Promise<Language[]>,
  async getEnabledLanguages() {
    const codes = await enabledCodes();
    return (await getLanguages()).filter((language) =>
      codes.includes(language.code)
    );
  },
  async setLanguages(languages) {
    config.set(LANGUAGES, languages);
  },
  getWords: () => getLearnedWords(),
  deleteWord: (word) => forget(word),
  async check(text) {
    return check(text, await enabledCodes());
  },
  async suggest(word) {
    return suggest(word, await enabledCodes());
  },
  learn: (word) => learn(word),
  ignore: (word) => ignore(word)
};
