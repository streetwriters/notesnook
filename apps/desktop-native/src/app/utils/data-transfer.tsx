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

import { pluralize } from "@notesnook/common";
import {
  Flex,
  Text,
  type DragPayload,
  type UIDataTransfer
} from "@notesnook/ui-kit";
import { tryParse } from "./parse";

const DRAG_MIME_TYPE = "application/vnd.notesnook.items";

/**
 * Puts the dragged items on the drag's data, as web does. Returns the drag
 * ghost: desktop draws the value `onDragStart` returns under the pointer, as
 * web's `setDragImage` does.
 */
export function setDragData(
  dataTransfer: UIDataTransfer,
  type: string,
  ids: string[]
): DragPayload {
  dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify({ type: type, ids }));
  return {
    ghost: (
      <Flex
        sx={{
          bg: "background",
          border: "1px solid",
          borderColor: "border",
          borderRadius: 5,
          px: 5
        }}
      >
        <Text sx={{ color: "paragraph", fontSize: 16 }}>
          {pluralize(ids.length, "item")}
        </Text>
      </Flex>
    )
  };
}

export function getDragData(
  dataTransfer: UIDataTransfer,
  type: string
): string[] {
  try {
    const data = tryParse(dataTransfer.getData(DRAG_MIME_TYPE));
    if (!data || data.type !== type || !data.ids) return [];
    return data.ids;
  } catch (e) {
    console.error(e);
    return [];
  }
}
