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

import { strings } from "@notesnook/intl";
import type { PressEvent } from "@ui";
import { CheckboxRemove } from "./icons";
import { Checkbox } from "./checkbox";
import {
  findSelectionIndex,
  useRelationChangesStore
} from "../stores/relation-changes-store";

export function SelectedCheck({
  item,
  size = 20,
  onClick
}: {
  item?: { id: string };
  size?: number;
  onClick?: () => void;
}) {
  const selectedItems = useRelationChangesStore((store) => store.selected);
  const selectedItem =
    item && selectedItems[findSelectionIndex(item, selectedItems)];

  if (selectedItem?.op === "remove") {
    return (
      <CheckboxRemove
        size={size}
        onPress={(event: PressEvent) => {
          event.stopPropagation();
          onClick?.();
        }}
        color="accent-error"
      />
    );
  }

  return (
    <Checkbox
      onToggle={onClick}
      size={size}
      checked={selectedItem?.op === "add"}
      aria-label={strings.selectItem()}
      checkboxUncheckedIconColor="icon-disabled"
    />
  );
}
