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

import { Button, Flex, Text } from "@theme-ui/components";
import { useSpellChecker } from "../../../hooks/use-spell-checker";
import { Close } from "../../../components/icons";

export function DictionaryWords() {
  const words = useSpellChecker((store) => store.words);
  const deleteWord = useSpellChecker((store) => store.deleteWord);

  if (!words.length) return null;

  return (
    // pull the chips up under the row description
    <Flex sx={{ flexWrap: "wrap", gap: "spacing4", ml: "37px", mt: "-7px" }}>
      {words.map((word) => (
        <Flex
          key={word}
          sx={{
            alignItems: "center",
            gap: "spacing4",
            px: "spacing4",
            py: "13px",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "radius2"
          }}
        >
          <Text
            variant="body"
            sx={{ fontSize: "sm", fontWeight: 400, color: "paragraph" }}
          >
            {word}
          </Text>
          <Button
            type="button"
            aria-label={`Delete ${word}`}
            onClick={() => deleteWord(word)}
            sx={{
              width: 20,
              height: 20,
              p: 0,
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              bg: "transparent",
              border: "none",
              borderRadius: "3px",
              color: "paragraph",
              cursor: "pointer",
              ":hover": { bg: "hover" }
            }}
          >
            <Close size={15} />
          </Button>
        </Flex>
      ))}
    </Flex>
  );
}
