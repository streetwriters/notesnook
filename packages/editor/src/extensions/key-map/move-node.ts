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
import { isListActive } from "../../utils/list.js";
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

type ResolvedNode = {
  pos: number;
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

function resolveNode(editor: Editor) {
  const { state } = editor;
  const { $from } = state.selection;

  let targetType = $from.node().type;
  let currentResolved = findParentNodeOfType(targetType)(state.selection);

  if (isListActive(editor)) {
    const currentNode = $from.node();
    const parentNode = $from.node($from.depth - 1);
    const isFirstParagraph =
      currentNode.type.name === "paragraph" &&
      parentNode.firstChild === currentNode;

    // move the entire list item
    if (isFirstParagraph) {
      targetType = $from.node($from.depth - 1).type;
      if (
        targetType.name === Callout.name ||
        targetType.name === Blockquote.name
      ) {
        targetType = $from.node($from.depth - 2).type;
      }
    }

    currentResolved = findParentNodeOfType(targetType)(state.selection);
  }

  if (
    findParentNodeClosestToPos($from, (node) => node.type.name === Callout.name)
  ) {
    const currentNode = $from.node();
    const parentNode = $from.node($from.depth - 1);
    const isFirstHeading =
      currentNode.type.name === "heading" &&
      parentNode.firstChild === currentNode;

    // move the entire callout
    if (isFirstHeading) {
      targetType = $from.node($from.depth - 1).type;
    }

    currentResolved = findParentNodeOfType(targetType)(state.selection);
  }

  return currentResolved;
}

function resolveParentNode(editor: Editor) {
  const { state } = editor;
  const { $from } = state.selection;

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

  const parent = findParentNodeClosestToPos($from, (node) =>
    validParents.includes(node.type.name)
  );

  if (!parent) return undefined;

  const targetType = parent.node.type;
  return findParentNodeOfType(targetType)(state.selection);
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
