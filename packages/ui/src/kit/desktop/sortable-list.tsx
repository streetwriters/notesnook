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
import { Flex } from "./primitives";

const SORTABLE_TYPE = "application/x-notesnook-sortable";

export function SortableList<T extends Contract.SortableItem>(
  props: Contract.SortableListProps<T>
) {
  const { items, renderItem, onMove, direction = "vertical" } = props;
  const [dragging, setDragging] = useState<string>();
  const [over, setOver] = useState<string>();

  return (
    <Flex
      data-test-id={props["data-test-id"]}
      sx={{
        flexDirection: direction === "vertical" ? "column" : "row",
        ...props.sx
      }}
    >
      {items.map((item, index) => (
        <Flex
          key={item.id}
          sx={{ flexDirection: direction === "vertical" ? "column" : "row" }}
          draggable
          onDragStart={(event) => {
            setDragging(item.id);
            event.dataTransfer.setData(
              SORTABLE_TYPE,
              JSON.stringify({ id: item.id, group: item.group })
            );
          }}
          onDragEnd={() => {
            setDragging(undefined);
            setOver(undefined);
          }}
          onDragEnter={() => setOver(item.id)}
          onDragLeave={() =>
            setOver((current) => (current === item.id ? undefined : current))
          }
          onDrop={(event) => {
            const data = event.dataTransfer.getData(SORTABLE_TYPE);
            const payload = (data ? JSON.parse(data) : undefined) as
              | Contract.SortableItem
              | undefined;
            setDragging(undefined);
            setOver(undefined);
            if (!payload || payload.id === item.id) return;
            onMove({
              activeId: payload.id,
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
