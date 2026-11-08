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

import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text, type SxProp } from "@ui";

type ContentToggleProps = {
  isSelected: boolean;
  isOtherSelected: boolean;
  onToggle: () => void;
  label: string;
  dateEdited: number;
  resolveConflict: (saveCopy: boolean) => void;
  readonly: boolean;
  sx: SxProp;
};
function ContentToggle(props: ContentToggleProps) {
  const {
    isSelected,
    isOtherSelected,
    onToggle,
    label,
    dateEdited,
    resolveConflict,
    readonly,
    sx
  } = props;

  return (
    <Flex sx={{ ...sx, flexDirection: "column" }}>
      {!readonly && (
        <Flex sx={{ flexDirection: "row" }}>
          {isOtherSelected && (
            <Button
              variant="accent"
              onPress={() => resolveConflict(true)}
              sx={{ mr: 2, p: 1, px: 2 }}
            >
              {strings.saveACopy()}
            </Button>
          )}
          <Button
            variant={isOtherSelected ? "error" : "accent"}
            onPress={() => {
              if (isOtherSelected) {
                resolveConflict(false);
              } else {
                onToggle();
              }
            }}
            sx={{ p: 1, px: 2 }}
          >
            {isSelected
              ? strings.undo()
              : isOtherSelected
              ? strings.discard()
              : strings.keep()}
          </Button>
        </Flex>
      )}
      <Text variant="subBody" sx={{ mt: 1 }}>
        {label} | {getFormattedDate(dateEdited)}
      </Text>
    </Flex>
  );
}
export default ContentToggle;
