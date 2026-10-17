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

import { Node as ProsemirrorNode } from "@tiptap/pm/model";


const TABLE = "table";

const WINDOWABLE_CONTAINERS = new Set([
  TABLE,
  "bulletList",
  "orderedList",
  "taskList",
  "checkList",
  "outlineList"
]);

export const TABLE_ROW_NODE = "tableRow";
export const LIST_ITEM_NODE = "listItem";

const MIN_CHILDREN = 50;

const MAX_DEPTH = 20;

export const CHILDREN_BEFORE_MEASURING = 30;

export type WindowedContainer = {
  node: ProsemirrorNode;
  offset: number;
  id: string;
};

type Found = Omit<WindowedContainer, "id">;

const containersByBlock = new WeakMap<ProsemirrorNode, WindowedContainer[]>();
const widestByTable = new WeakMap<ProsemirrorNode, number[]>();
const NO_CHILDREN: number[] = [];

function isWorthWindowing(node: ProsemirrorNode): boolean {
  return (
    WINDOWABLE_CONTAINERS.has(node.type.name) && node.childCount >= MIN_CHILDREN
  );
}

function findContainers(
  parent: ProsemirrorNode,
  contentStart: number,
  depth: number,
  found: Found[]
): void {
  parent.forEach((child, offset) => {
    if (child.isLeaf || child.isTextblock) return;
    const start = contentStart + offset;
    if (isWorthWindowing(child)) found.push({ node: child, offset: start });
    else if (depth < MAX_DEPTH)
      findContainers(child, start + 1, depth + 1, found);
  });
}

/** The containers within `block` that are long enough to be worth windowing. */
export function containersWorthWindowing(
  block: ProsemirrorNode
): WindowedContainer[] {
  const cached = containersByBlock.get(block);
  if (cached) return cached;

  const blockId = block.attrs.blockId as string | undefined;
  const found: Found[] = [];
  if (blockId) {
    if (isWorthWindowing(block)) found.push({ node: block, offset: 0 });
    else findContainers(block, 1, 0, found);
  }

  const containers = found.map((container, index) => ({
    ...container,
    id: `${blockId}#${index}`
  }));
  containersByBlock.set(block, containers);
  return containers;
}

/** The rows that decide each column's width, rendered whatever the window says. */
export function widestChildren(container: ProsemirrorNode): number[] {
  if (container.type.name !== TABLE) return NO_CHILDREN;

  const cached = widestByTable.get(container);
  if (cached) return cached;

  const widest: number[] = [];
  const rowFor: number[] = [];
  container.forEach((row, _offset, index) => {
    let column = 0;
    row.forEach((cell) => {
      if (!(widest[column] >= cell.content.size)) {
        widest[column] = cell.content.size;
        rowFor[column] = index;
      }
      column += Number(cell.attrs.colspan) || 1;
    });
  });

  const rows = [...new Set(rowFor)].sort((a, b) => a - b);
  widestByTable.set(container, rows);
  return rows;
}
