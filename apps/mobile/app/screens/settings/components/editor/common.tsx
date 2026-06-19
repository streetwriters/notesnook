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

import React from "react";
import { Group } from "./group";
import { DraggableItem } from "./state";
import { Tool } from "./tool";
export const renderTool = ({
  item,
  groupIndex,
  parentIndex
}: DraggableItem) => {
  const data = item as string[];

  if (!data) return null;

  const tools = data.map((item, index) => (
    <Tool
      key={Array.isArray(item) ? `subgroup-${index}` : item}
      item={item}
      index={index}
      groupIndex={groupIndex}
      parentIndex={parentIndex}
    />
  ));

  if (Array.isArray(data[0])) {
    tools.unshift(
      <Tool
        key={"dummy"}
        item={"dummy"}
        index={-1}
        groupIndex={groupIndex}
        parentIndex={parentIndex}
      />
    );
  }

  return tools;
};

export const renderGroup = ({ item, index, parentIndex }: DraggableItem) => (
  <Group item={item} index={index} parentIndex={parentIndex} />
);
