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

import { Flex, Button, Text, FlexProps } from "@theme-ui/components";
import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";

type ContentToggle = {
  isSelected: boolean;
  isOtherSelected: boolean;
  onToggle: () => void;
  label: string;
  dateEdited: number;
  resolveConflict: (saveCopy: boolean) => void;
  readonly: boolean;
  sx: FlexProps["sx"];
};
function ContentToggle(props: ContentToggle) {
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
        <Flex>
          {isOtherSelected && (
            <Button
              variant="accent"
              mr={2}
              onClick={() => resolveConflict(true)}
              p={1}
              px={2}
            >
              {strings.saveACopy()}
            </Button>
          )}
          <Button
            variant={isOtherSelected ? "error" : "accent"}
            onClick={() => {
              if (isOtherSelected) {
                resolveConflict(false);
              } else {
                onToggle();
              }
            }}
            p={1}
            px={2}
          >
            {isSelected
              ? strings.undo()
              : isOtherSelected
              ? strings.discard()
              : strings.keep()}
          </Button>
        </Flex>
      )}
      <Text variant="subBody" mt={1}>
        {label} | {getFormattedDate(dateEdited)}
      </Text>
    </Flex>
  );
}
export default ContentToggle;
