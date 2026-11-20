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

import { Language, useSpellChecker } from "../../../hooks/use-spell-checker";
import { Box, Flex, Input, Text } from "@theme-ui/components";
import { useCallback, useEffect, useState } from "react";
import { deleteItem } from "@notesnook/core";
import { FlexScrollContainer } from "../../../components/scroll-container";
import { Checkbox } from "../../../components/checkbox";
import { strings } from "@notesnook/intl";

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

  const toggleLanguage = async (code: string, checked: boolean) => {
    const copiedLanguages = enabledLanguages.slice();

    if (checked) copiedLanguages.push(code);
    else deleteItem(copiedLanguages, code);

    await spellChecker.setLanguages(copiedLanguages);
  };

  return (
    <>
      <Input
        placeholder={strings.filterLanguages()}
        sx={{
          ml: "37px",
          width: "calc(100% - 37px)",
          boxSizing: "border-box",
          px: "spacing4",
          py: "spacing6",
          fontSize: "sm",
          lineHeight: 1,
          bg: "background-secondary",
          border: "none",
          borderRadius: "radius2",
          outline: "none",
          "::placeholder": { color: "placeholder" }
        }}
        onChange={(e) => filter(e.currentTarget.value.toLowerCase().trim())}
      />
      <Box
        sx={{
          mt: "spacing6",
          mx: "-13px",
          borderTop: "1px solid",
          borderColor: "separator"
        }}
      >
        <FlexScrollContainer
          suppressAutoHide
          style={{ maxHeight: 215, paddingTop: 15 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "max-content max-content",
              columnGap: "80px",
              rowGap: "spacing4",
              justifyContent: "start",
              px: "spacing5"
            }}
          >
            {languages.map((lang) => {
              const checked = enabledLanguages.includes(lang.code);
              return (
                <Flex
                  key={lang.code}
                  sx={{
                    alignItems: "center",
                    gap: "spacing4",
                    cursor: "pointer"
                  }}
                  onClick={() => toggleLanguage(lang.code, !checked)}
                >
                  <Checkbox
                    checked={checked}
                    aria-label={lang.name}
                    size={15}
                    checkboxUncheckedIconColor="icon-disabled"
                    onToggle={() => toggleLanguage(lang.code, !checked)}
                  />
                  <Text
                    variant="body"
                    sx={{
                      fontSize: "sm",
                      lineHeight: 1,
                      color: checked
                        ? "paragraph-selected"
                        : "paragraph-secondary"
                    }}
                  >
                    {lang.name}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        </FlexScrollContainer>
      </Box>
    </>
  );
}
