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
import { Checkbox, Flex, Input, ScrollContainer, Text } from "@ui";
import { deleteItem } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Language, useSpellChecker } from "../../../hooks/use-spell-checker";

export function SpellCheckerLanguages() {
  const spellChecker = useSpellChecker();
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    if (!spellChecker.enabledLanguages || !spellChecker.languages) return;

    setEnabledLanguages(spellChecker.enabledLanguages.map((a) => a.code));
    setLanguages(spellChecker.languages.slice());
  }, [spellChecker.enabledLanguages, spellChecker.languages]);

  const filter = useCallback(
    async (query: string) => {
      if (!spellChecker.languages) return;
      setLanguages(
        spellChecker.languages.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.code.toLowerCase().includes(query)
        )
      );
    },
    [spellChecker]
  );

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Input
        placeholder={strings.filterLanguages()}
        sx={{ mx: "2px", my: 2 }}
        onChangeText={(text) => filter(text.toLowerCase().trim())}
      />
      <ScrollContainer sx={{ maxHeight: 400 }}>
        <Flex sx={{ flexDirection: "column" }}>
          {languages.map((lang) => (
            <Flex
              key={lang.code}
              sx={{ flexDirection: "row", alignItems: "center", mb: 1, gap: 1 }}
            >
              <Checkbox
                sx={{ width: 14, height: 14 }}
                checked={enabledLanguages.includes(lang.code)}
                onChange={async (checked) => {
                  const copiedLanguages = enabledLanguages.slice();

                  if (checked) copiedLanguages.push(lang.code);
                  else deleteItem(copiedLanguages, lang.code);

                  await spellChecker.setLanguages(copiedLanguages);
                }}
              />
              <Text variant="body">{lang.name}</Text>
            </Flex>
          ))}
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}
