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

import TaskList from "@tiptap/extension-task-list";
import { Transaction } from "@tiptap/pm/state";
import { Fragment, Node as ProsemirrorNode } from "prosemirror-model";
import { NodeWithPos } from "@tiptap/core";
import { findParentNodeClosestToPos } from "../../utils/prosemirror.js";
import TaskItem from "@tiptap/extension-task-item";
import { TaskItemNode } from "../task-item/index.js";

export function countCheckedItems(node: ProsemirrorNode) {
  let checked = 0;
  let total = 0;
  node.descendants((node) => {
    if (node.type.name === TaskItem.name) {
      if (node.attrs.checked) checked++;
      total++;
    }
  });
  return { checked, total };
}

export function deleteCheckedItems(tr: Transaction, pos: number) {
  const node = tr.doc.nodeAt(pos);

  const parent = node ? { node, pos } : null;
  if (!parent || parent.node.type.name !== TaskList.name) return;

  const sublists: NodeWithPos[] = [];
  parent.node.descendants((node, nodePos) => {
    if (node.type.name === TaskList.name)
      sublists.push({ node, pos: pos + nodePos + 1 });
  });
  if (sublists.length > 1) sublists.reverse();
  sublists.push(parent);

  for (const list of sublists) {
    const listNode = tr.doc.nodeAt(tr.mapping.map(list.pos));
    if (!listNode) continue;

    const children: ProsemirrorNode[] = [];
    listNode.forEach((node, _, index) => {
      if (!node.attrs.checked) children.push(listNode.child(index));
    });
    // if all items are unchecked, skip
    if (children.length === listNode.childCount) continue;

    tr.replaceWith(
      tr.mapping.map(list.pos + 1),
      tr.mapping.map(list.pos + list.node.nodeSize - 1),
      Fragment.from(children)
    );
  }

  if (!tr.steps.length) return null;
  return tr;
}

export function sortList(tr: Transaction, pos: number) {
  const node = tr.doc.nodeAt(pos);

  const parent = node ? { node, pos } : null;
  if (!parent || parent.node.type.name !== TaskList.name) return;

  const sublists: NodeWithPos[] = [];
  parent.node.descendants((node, nodePos) => {
    if (node.type.name === TaskList.name)
      sublists.push({ node, pos: pos + nodePos + 1 });
  });
  if (sublists.length > 1) sublists.reverse();
  sublists.push(parent);

  for (const list of sublists) {
    const listNode = tr.doc.nodeAt(tr.mapping.map(list.pos));
    if (!listNode) continue;

    const children: {
      checked: number;
      index: number;
    }[] = [];

    listNode.forEach((node, _, index) => {
      children.push({
        index,
        checked: node.attrs.checked ? 1 : 0
      });
    });
    // if every item is checked or unchecked, skip
    if (
      children.every((a) => a.checked === 1) ||
      children.every((a) => a.checked === 0)
    )
      continue;

    tr.replaceWith(
      tr.mapping.map(list.pos + 1),
      tr.mapping.map(list.pos + listNode.nodeSize - 1),
      Fragment.from(
        children
          .sort((a, b) => a.checked - b.checked)
          .map((c) => listNode.child(c.index))
      )
    );
  }

  if (!tr.steps.length) return null;
  return tr;
}

const invalidTaskListParents = [TaskList.name, TaskItem.name];
export function findRootTaskList(doc: ProsemirrorNode, pos?: number) {
  if (!pos) return;
  return findParentNodeClosestToPos(
    doc.resolve(pos),
    (node, parent) =>
      node.type.name === TaskList.name &&
      (!parent || !invalidTaskListParents.includes(parent.type.name))
  );
}

export function toggleChildren(
  tr: Transaction,
  node: ProsemirrorNode,
  toggleState: boolean,
  parentPos: number
) {
  let changes = 0;
  node.descendants((node, pos) => {
    if (
      node.type.name === TaskItemNode.name &&
      toggleState !== node.attrs.checked
    ) {
      const actualPos = pos + parentPos + 1;
      tr.setNodeMarkup(tr.mapping.map(actualPos), undefined, {
        ...node.attrs,
        checked: toggleState
      });
      changes++;
    }
  });
  return changes;
}
