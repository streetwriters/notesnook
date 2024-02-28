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

import { Button, Label } from "@theme-ui/components";
import { useEffect } from "react";
import { FlexScrollContainer } from "../../../components/scroll-container";
import { useStore as useSettingStore } from "../../../stores/setting-store";

export function DictionaryWords() {
  const words = useSettingStore((store) => store.dictionaryWords);
  const deleteWord = useSettingStore((store) => store.deleteDictionaryWords);
  const refresh = useSettingStore((store) => store.refresh);

  useEffect(() => {
    async () => await refresh();
  });

  return (
    <>
      <FlexScrollContainer suppressAutoHide style={{ maxHeight: 400 }}>
        {words?.map((word) => (
          <Label key={word} variant="text.body" sx={{ mb: 1 }}>
            <Button
              variant="menuitem"
              onClick={async () => {
                await deleteWord(word);
                await refresh();
              }}
            >
              {word}
            </Button>
          </Label>
        ))}
      </FlexScrollContainer>
    </>
  );
}
