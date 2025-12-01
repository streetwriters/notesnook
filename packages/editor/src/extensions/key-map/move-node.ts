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

import { Editor } from "@tiptap/core";
import OrderedList from "@tiptap/extension-ordered-list";
import { Fragment, Node, Slice } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { ReplaceStep } from "@tiptap/pm/transform";
import {
  findParentNodeClosestToPos,
  findParentNodeOfType
} from "../../utils/prosemirror.js";
import { Blockquote } from "../blockquote/blockquote.js";
import { BulletList } from "../bullet-list/bullet-list.js";
import { Callout } from "../callout/callout.js";
import { CheckList } from "../check-list/check-list.js";
import { OutlineList } from "../outline-list/outline-list.js";
import { Table } from "../table/table.js";
import { TaskListNode } from "../task-list/task-list.js";
import { ListItem } from "../list-item/list-item.js";
import { CheckListItem } from "../check-list-item/check-list-item.js";
import { TaskItemNode } from "../task-item/task-item.js";
import { OutlineListItem } from "../outline-list-item/outline-list-item.js";

type ResolvedNode = {
  start: number;
  depth: number;
  node: Node;
};

function mapChildren<T>(
  node: Node | Fragment,
  callback: (child: Node, index: number, frag: Fragment) => T
): T[] {
  const array = [];
  for (let i = 0; i < node.childCount; i++) {
    array.push(
      callback(node.child(i), i, node instanceof Fragment ? node : node.content)
    );
  }
  return array;
}

const listItems = [
  ListItem.name,
  CheckListItem.name,
  TaskItemNode.name,
  OutlineListItem.name
];

function resolveNode(editor: Editor): ResolvedNode | undefined {
  const { state } = editor;
  const { $from } = state.selection;

  const currentNode = $from.node();
  const parentNode = $from.node($from.depth - 1);
  let targetType = currentNode.type;
  let currentResolved: ResolvedNode | undefined = {
    start: $from.start(),
    depth: $from.depth,
    node: currentNode
  };

  if (listItems.includes(parentNode.type.name)) {
    const isFirstParagraph =
      currentNode.type.name === "paragraph" &&
      parentNode.firstChild === currentNode;

    if (isFirstParagraph) {
      targetType = parentNode.type;
      currentResolved = findParentNodeOfType(targetType)(state.selection);
    }
  }

  if (parentNode.type.name === Callout.name) {
    const isFirstHeading =
      currentNode.type.name === "heading" &&
      parentNode.firstChild === currentNode;

    if (isFirstHeading) {
      targetType = parentNode.type;
      currentResolved = findParentNodeOfType(targetType)(state.selection);
    }
  }

  return currentResolved;
}

const validParents = [
  Callout.name,
  Table.name,
  BulletList.name,
  OrderedList.name,
  TaskListNode.name,
  CheckList.name,
  OutlineList.name,
  Blockquote.name
];

function resolveParentNode(editor: Editor): ResolvedNode | undefined {
  const { state } = editor;
  const { $from } = state.selection;

  const parent = findParentNodeClosestToPos($from, (node) =>
    validParents.includes(node.type.name)
  );

  if (!parent) return undefined;

  return {
    start: parent.start,
    depth: parent.depth,
    node: parent.node
  };
}

function swapNodeWithSibling(
  editor: Editor,
  resolvedNode: ResolvedNode,
  isDown: boolean
): boolean {
  const { state } = editor;
  const { $from } = state.selection;

  const parentDepth = resolvedNode.depth - 1;
  const parent = $from.node(parentDepth);
  const parentPos = $from.start(parentDepth);

  let arr = mapChildren(parent, (node) => node);
  let index = arr.indexOf(resolvedNode.node);
  let swapWith = isDown ? index + 1 : index - 1;

  if (swapWith >= arr.length || swapWith < 0) {
    return false;
  }
  if (swapWith === 0 && parent.type.name === Callout.name) {
    return false;
  }

  const swapWithNodeSize = arr[swapWith].nodeSize;

  [arr[index], arr[swapWith]] = [arr[swapWith], arr[index]];

  let tr = state.tr;
  let replaceStart = parentPos;
  let replaceEnd = $from.end(parentDepth);

  const slice = new Slice(Fragment.fromArray(arr), 0, 0);

  tr = tr.step(new ReplaceStep(replaceStart, replaceEnd, slice, false));
  tr = tr.setSelection(
    Selection.near(
      tr.doc.resolve(
        isDown ? $from.pos + swapWithNodeSize : $from.pos - swapWithNodeSize
      )
    )
  );
  tr.scrollIntoView();
  editor.view.dispatch(tr);
  return true;
}

export function moveNodeUp(editor: Editor): boolean {
  const { state } = editor;
  if (!state.selection.empty) return false;

  const resolved = resolveNode(editor);
  if (!resolved) return false;

  return swapNodeWithSibling(editor, resolved, false);
}

export function moveNodeDown(editor: Editor): boolean {
  const { state } = editor;
  if (!state.selection.empty) return false;

  const resolved = resolveNode(editor);
  if (!resolved) return false;

  return swapNodeWithSibling(editor, resolved, true);
}

export function moveParentUp(editor: Editor): boolean {
  const { state } = editor;
  if (!state.selection.empty) return false;

  const resolved = resolveParentNode(editor);
  if (!resolved) return false;

  return swapNodeWithSibling(editor, resolved, false);
}

export function moveParentDown(editor: Editor): boolean {
  const { state } = editor;
  if (!state.selection.empty) return false;

  const resolved = resolveParentNode(editor);
  if (!resolved) return false;

  return swapNodeWithSibling(editor, resolved, true);
}
