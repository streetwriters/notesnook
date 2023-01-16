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

import {
  Editor,
  findParentNode,
  NodeWithPos,
  Predicate,
  findParentNodeClosestToPos
} from "@tiptap/core";
import {
  Node as ProsemirrorNode,
  Mark,
  NodeType,
  ResolvedPos
} from "prosemirror-model";
import { EditorState, Selection } from "prosemirror-state";

export type NodeWithOffset = {
  node?: ProsemirrorNode;
  from: number;
  to: number;
};

export function findSelectedDOMNode(
  editor: Editor,
  types: string[]
): HTMLElement | null {
  const { $anchor } = editor.state.selection;

  const selectedNode = editor.state.doc.nodeAt($anchor.pos);
  const pos = types.includes(selectedNode?.type.name || "")
    ? $anchor.pos
    : findParentNode((node) => types.includes(node.type.name))(
        editor.state.selection
      )?.pos;
  if (!pos) return null;

  return (editor.view.nodeDOM(pos) as HTMLElement) || null;
}

export function findSelectedNode(
  editor: Editor,
  type: string
): ProsemirrorNode | null {
  const { $anchor } = editor.state.selection;

  const selectedNode = editor.state.doc.nodeAt($anchor.pos);
  const pos =
    selectedNode?.type.name === type
      ? $anchor.pos
      : findParentNode((node) => node.type.name === type)(
          editor.state.selection
        )?.pos;
  if (pos === undefined) return null;

  return editor.state.doc.nodeAt(pos);
}

export function findMark(
  node: ProsemirrorNode,
  type: string
): Mark | undefined {
  const mark = node.marks.find((m) => m.type.name === type);
  return mark;
}

export function selectionToOffset(state: EditorState): NodeWithOffset {
  const { $from, from } = state.selection;
  return {
    node: state.doc.nodeAt(from) || undefined,
    from,
    to: from + $from.node().nodeSize
  };
}

export function findListItemType(editor: Editor): string | null {
  const isTaskList = editor.isActive("taskList");
  const isOutlineList = editor.isActive("outlineList");
  const isList =
    editor.isActive("bulletList") || editor.isActive("orderedList");

  return isList
    ? "listItem"
    : isOutlineList
    ? "outlineListItem"
    : isTaskList
    ? "taskItem"
    : null;
}

export function isListActive(editor: Editor): boolean {
  const isTaskList = editor.isActive("taskList");
  const isOutlineList = editor.isActive("outlineList");
  const isList =
    editor.isActive("bulletList") || editor.isActive("orderedList");

  return isTaskList || isOutlineList || isList;
}

export const findChildren = (
  node: ProsemirrorNode,
  predicate: Predicate,
  descend: boolean
) => {
  if (!node) {
    throw new Error('Invalid "node" parameter');
  } else if (!predicate) {
    throw new Error('Invalid "predicate" parameter');
  }
  return walkNode(node, descend).filter((child) => predicate(child.node));
};

export function findChildrenByType(
  node: ProsemirrorNode,
  nodeType: NodeType,
  descend = true
): NodeWithPos[] {
  return findChildren(node, (child) => child.type === nodeType, descend);
}

export const findParentNodeOfTypeClosestToPos = (
  $pos: ResolvedPos,
  nodeType: NodeType
) => {
  return findParentNodeClosestToPos($pos, (node) =>
    equalNodeType(nodeType, node)
  );
};

export function hasParentNode(predicate: Predicate) {
  return function (selection: Selection) {
    return !!findParentNode(predicate)(selection);
  };
}

export function hasParentNodeOfType(nodeType: NodeType | NodeType[]) {
  return hasParentNode((node) => equalNodeType(nodeType, node));
}

export function findParentNodeOfType(nodeType: NodeType | NodeType[]) {
  return findParentNode((node) => equalNodeType(nodeType, node));
}

const walkNode = (node: ProsemirrorNode, descend = true) => {
  if (!node) {
    throw new Error('Invalid "node" parameter');
  }
  const result: NodeWithPos[] = [];
  node.descendants((child, pos) => {
    result.push({ node: child, pos });
    if (!descend) {
      return false;
    }
  });
  return result;
};

const equalNodeType = (
  nodeType: NodeType | NodeType[],
  node: ProsemirrorNode
) => {
  return (
    (Array.isArray(nodeType) && nodeType.indexOf(node.type) > -1) ||
    node.type === nodeType
  );
};
