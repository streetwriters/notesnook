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

import { useCallback, useEffect, useState } from "react";
import { desktop } from "../common/desktop-client";

export type Language = { code: string; name: string };
export type SpellCheckerOptions = {
  languages: Language[];
  enabledLanguages: Language[];
  enabled: boolean;
};

export default function useSpellChecker() {
  const [spellChecker, setSpellChecker] = useState<SpellCheckerOptions>();

  const loadSpellChecker = useCallback(async () => {
    setSpellChecker({
      enabledLanguages: await desktop.spellChecker.enabledLanguages.query(),
      languages: await desktop.spellChecker.languages.query(),
      enabled: await desktop.spellChecker.isEnabled.query()
    });
  }, []);

  useEffect(() => {
    (async function () {
      await loadSpellChecker();
    })();
  }, [loadSpellChecker]);

  const toggle = useCallback(
    async (enabled: boolean) => {
      await desktop.spellChecker.toggle.mutate(enabled);
      await loadSpellChecker();
    },
    [loadSpellChecker]
  );

  const setLanguages = useCallback(
    async (languages: string[]) => {
      await desktop.spellChecker.setLanguages.mutate(languages);
      await loadSpellChecker();
    },
    [loadSpellChecker]
  );

  return {
    ...spellChecker,
    toggle,
    setLanguages,
    loadSpellChecker
  };
}
