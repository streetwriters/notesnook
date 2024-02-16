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

import { desktop } from "../common/desktop-bridge";
import BaseStore from "../stores";
import createStore from "../common/store";

export type Language = { code: string; name: string };

class SpellCheckerStore extends BaseStore<SpellCheckerStore> {
  languages: Language[] = [];
  enabled = true;
  enabledLanguages: Language[] = [];
  words: string[] = [];

  toggleSpellChecker = async () => {
    const enabled = this.get().enabled;
    await desktop?.spellChecker.toggle.mutate({ enabled: !enabled });
    this.set({
      enabled: !enabled
    });
  };

  setLanguages = async (languages: string[]) => {
    await desktop?.spellChecker.setLanguages.mutate(languages);
    this.set({
      enabledLanguages: await desktop?.spellChecker.enabledLanguages.query()
    });
  };

  refresh = async () => {
    this.set({
      enabledLanguages:
        (await desktop?.spellChecker.enabledLanguages.query()) || [],
      languages: (await desktop?.spellChecker.languages.query()) || [],
      enabled: await desktop?.spellChecker.isEnabled.query(),
      words: (await desktop?.spellChecker.words.query()) || []
    });
  };

  deleteWord = async (word: string) => {
    await desktop?.spellChecker.deleteWord.mutate(word);
    await this.get().refresh();
  };
}

const [useSpellChecker] = createStore<SpellCheckerStore>(
  (set, get) => new SpellCheckerStore(set, get)
);
export { useSpellChecker };
