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

import { useState } from "react";
import type * as Contract from "../contracts/lists";
import { KitFlex as Flex } from "./primitives";

// The item being dragged, shared so a list can refuse another list's items.
let active: Contract.SortableItem | undefined;

export function SortableList<T extends Contract.SortableItem>(
  props: Contract.SortableListProps<T>
) {
  const { items, renderItem, onMove, direction = "vertical" } = props;
  const [dragging, setDragging] = useState<string>();
  const [over, setOver] = useState<string>();
  const flexDirection = direction === "vertical" ? "column" : "row";
  const accepts = (item: T) => !!active && active.group === item.group;

  return (
    <Flex
      data-test-id={props["data-test-id"]}
      sx={{ flexDirection, ...props.sx }}
    >
      {items.map((item, index) => (
        <Flex
          key={item.id}
          sx={{ flexDirection }}
          draggable
          onDragStart={(event) => {
            active = { id: item.id, group: item.group };
            event.dataTransfer.setData("text/plain", item.id);
            event.dataTransfer.effectAllowed = "move";
            setDragging(item.id);
          }}
          onDragEnd={() => {
            active = undefined;
            setDragging(undefined);
            setOver(undefined);
          }}
          onDragOver={(event) => {
            if (!accepts(item)) return;
            event.preventDefault();
            setOver(item.id);
          }}
          onDragLeave={(event) => {
            const to = (event as { relatedTarget?: object }).relatedTarget;
            if (to && event.currentTarget.contains(to)) return;
            setOver((current) => (current === item.id ? undefined : current));
          }}
          onDrop={(event) => {
            const dragged = active;
            setDragging(undefined);
            setOver(undefined);
            if (!dragged || !accepts(item)) return;
            event.preventDefault();
            if (dragged.id === item.id) return;
            if (!items.some((other) => other.id === dragged.id)) return;
            onMove({
              activeId: dragged.id,
              overId: item.id,
              index,
              group: item.group
            });
          }}
        >
          {renderItem(item, {
            isDragging: dragging === item.id,
            isOver: over === item.id && dragging !== item.id
          })}
        </Flex>
      ))}
    </Flex>
  );
}
