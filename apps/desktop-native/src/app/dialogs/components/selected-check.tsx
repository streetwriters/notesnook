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

import { Checkbox, Flex } from "@ui";
import { strings } from "@notesnook/intl";
import { CheckboxRemove } from "../../components/icons";
import {
  findSelectionIndex,
  useRelationChangesStore
} from "../../stores/relation-changes-store";

export function SelectedCheck({
  item,
  size = 20,
  onPress
}: {
  item?: { id: string };
  size?: number;
  onPress?: (ctrl: boolean) => void;
}) {
  const selectedItems = useRelationChangesStore((store) => store.selected);
  const selectedItem =
    item && selectedItems[findSelectionIndex(item, selectedItems)];

  if (selectedItem?.op === "remove") {
    return (
      <Flex
        onPress={(e) => onPress?.(e.ctrlKey || e.metaKey)}
        sx={{ width: size, height: size }}
      >
        <CheckboxRemove size={size} color="accent-error" />
      </Flex>
    );
  }

  return (
    <Checkbox
      title={strings.selectItem()}
      checked={selectedItem?.op === "add"}
      onChange={() => onPress?.(false)}
      sx={{ width: size, height: size }}
    />
  );
}
