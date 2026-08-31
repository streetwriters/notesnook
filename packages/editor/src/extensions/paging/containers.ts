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

/**
 * Containers whose children stack one above the other, so rendering only some
 * of them leaves the rest in the right place. Anything not listed here is
 * rendered whole.
 */

const TABLE = "table";

const WINDOWABLE_CONTAINERS = new Set([
  TABLE,
  "bulletList",
  "orderedList",
  "taskList",
  "checkList",
  "outlineList"
]);

/** Child types the stand-in views are registered for. */
export const TABLE_ROW_NODE = "tableRow";
export const LIST_ITEM_NODE = "listItem";

/** Fewer children than this and rendering the whole container is cheap. */
const MIN_CHILDREN = 50;

/**
 * How far into a block to look for containers worth windowing.
 *
 * What keeps this walk cheap is not the limit but where it stops: at leaves, at
 * text, and at any container long enough to window, whose children it never
 * looks inside. The limit is only a guard against runaway recursion, so it is
 * set well past anything a writer would type -- outline and task lists nest as
 * deep as they like, and each level of nesting costs two steps here, one for
 * the list and one for the item holding the next one.
 */
const MAX_DEPTH = 20;

/** How many children to render before anything has been measured. */
export const CHILDREN_BEFORE_MEASURING = 30;

export type WindowedContainer = {
  node: ProsemirrorNode;
  /** Where the container begins, counted from the start of the block. */
  offset: number;
  /** Stable across edits, so a window survives the text changing under it. */
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

/**
 * The containers within `block` that are long enough to be worth windowing,
 * offset from where `block` itself begins. `block` counts as one of them, so
 * the same call covers both the blocks of a page and a table that is a note's
 * only block.
 *
 * Answers from the cache after the first look: nodes are immutable, so an edit
 * anywhere else never invalidates it.
 */
export function containersWorthWindowing(
  block: ProsemirrorNode
): WindowedContainer[] {
  const cached = containersByBlock.get(block);
  if (cached) return cached;

  // Only the blocks of a note are given ids of their own, so a container nested
  // inside one has none to be named by. Counting them off within their block
  // names them just as well, and just as steadily: editing the text around a
  // container does not change how many come before it, so its window survives.
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

/**
 * The rows that decide each column's width. A column is only as wide as its
 * widest cell, so leaving that cell out would make the column change width as
 * the reader scrolls -- and every row re-wrap with it. These rows are rendered
 * whatever the window says.
 *
 * Which cell is widest is taken from how much each one holds, since that is
 * what the width follows.
 */
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
