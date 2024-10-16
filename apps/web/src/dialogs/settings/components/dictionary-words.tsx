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

import { Button, Text } from "@theme-ui/components";
import { FlexScrollContainer } from "../../../components/scroll-container";
import { useSpellChecker } from "../../../hooks/use-spell-checker";
import { strings } from "@notesnook/intl";

export function DictionaryWords() {
  const words = useSpellChecker((store) => store.words);
  const deleteWord = useSpellChecker((store) => store.deleteWord);

  return (
    <>
      <FlexScrollContainer
        suppressAutoHide
        style={{
          maxHeight: 400,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Text variant="body" sx={{ my: 1 }}>
          {strings.customDictWords(words.length)}
        </Text>
        {words.map((word) => (
          <Button
            key={word}
            variant="menuitem"
            sx={{ textAlign: "left", p: 1 }}
            onClick={() => deleteWord(word)}
          >
            {word}
          </Button>
        ))}
      </FlexScrollContainer>
    </>
  );
}
