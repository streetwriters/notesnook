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
import setSpellCheckerLanguages from "../commands/set-spell-checker-languages";
import toggleSpellChecker from "../commands/toggle-spell-checker";

export default function useSpellChecker() {
  const [spellChecker, setSpellChecker] = useState<SpellCheckerOptions>();

  const loadSpellChecker = useCallback(async () => {
    const options = await window.config.spellChecker();
    setSpellChecker(options);
    return options;
  }, []);

  useEffect(() => {
    if (!window.config) return;
    (async function () {
      await loadSpellChecker();
    })();
  }, [loadSpellChecker]);

  const toggle = useCallback(
    async (enabled: boolean) => {
      toggleSpellChecker(enabled);
      await loadSpellChecker();
    },
    [loadSpellChecker]
  );

  const setLanguages = useCallback(
    async (languages: string[]) => {
      setSpellCheckerLanguages(languages);
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
