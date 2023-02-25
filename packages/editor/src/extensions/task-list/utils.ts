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
import { TaskItemNode } from "../task-item";
import { NodeWithPos } from "@tiptap/core";

export function countCheckedItems(node: ProsemirrorNode) {
  let checked = 0;
  let total = 0;
  node.descendants((node) => {
    if (node.type.name === TaskItemNode.name) {
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

    tr.replaceWith(
      tr.mapping.map(list.pos),
      tr.mapping.map(list.pos + list.node.nodeSize),
      listNode.copy(Fragment.from(children))
    );
  }

  if (!tr.steps.length) return null;
  return tr;
}

