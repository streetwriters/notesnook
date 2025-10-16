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

import { Editor, Extension } from "@tiptap/core";
import { CodeBlock } from "../code-block/index.js";
import { showLinkPopup } from "../../toolbar/popups/link-popup.js";
import { isListActive } from "../../utils/list.js";
import { tiptapKeys } from "@notesnook/common";
import { isInTable } from "../table/prosemirror-tables/util.js";
import { config } from "../../utils/config.js";
import { DEFAULT_COLORS } from "../../toolbar/tools/colors.js";
import { findParentNodeOfType } from "../../utils/prosemirror.js";
import { Fragment, Node, Slice } from "@tiptap/pm/model";
import { ReplaceStep } from "@tiptap/pm/transform";
import { Selection } from "@tiptap/pm/state";
import { Callout } from "../callout/callout.js";

export const KeyMap = Extension.create({
  name: "key-map",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (
          isListActive(editor) ||
          isInTable(editor.state) ||
          editor.isActive(CodeBlock.name)
        )
          return false;

        return editor.commands.insertContent("\t");
      },
      "Shift-Tab": ({ editor }) => {
        if (isListActive(editor)) return false;
        return true;
      },
      [tiptapKeys.removeFormattingInSelection.keys]: ({ editor }) => {
        editor
          .chain()
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .unsetMark("link")
          .run();
        return true;
      },
      [tiptapKeys.insertInternalLink.keys]: ({ editor }) => {
        editor.storage.createInternalLink?.().then((link) => {
          if (!link) return;

          const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          );
          editor.commands.setLink({
            ...link,
            title: selectedText || link.title
          });
        });
        return true;
      },
      [tiptapKeys.insertLink.keys]: ({ editor }) => {
        showLinkPopup(editor);
        return true;
      },
      [tiptapKeys.toggleTextColor.keys]: ({ editor }) => {
        const color =
          config.get<"string">("textColor") || DEFAULT_COLORS.text[0];
        return editor.commands.toggleMark("textStyle", { color });
      },
      [tiptapKeys.moveLineUp.keys]: ({ editor }) => {
        return moveNode(editor, "up");
      },
      [tiptapKeys.moveLineDown.keys]: ({ editor }) => {
        return moveNode(editor, "down");
      }
    };
  }
});

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

/**
 * implementation inspired from https://discuss.prosemirror.net/t/keymap-to-move-a-line/3645/5
 */
function moveNode(editor: Editor, dir: "up" | "down") {
  const isDown = dir === "down";
  const { state } = editor;
  if (!state.selection.empty) {
    return false;
  }

  const { $from } = state.selection;

  let currentResolved;
  let targetType;

  const outlineListItem = findParentNodeOfType(
    editor.schema.nodes.outlineListItem
  )(state.selection);
  const taskItem = findParentNodeOfType(editor.schema.nodes.taskItem)(
    state.selection
  );
  const listItem = findParentNodeOfType(editor.schema.nodes.listItem)(
    state.selection
  );
  if (outlineListItem) {
    currentResolved = outlineListItem;
    targetType = editor.schema.nodes.outlineListItem;
  } else if (taskItem) {
    currentResolved = taskItem;
    targetType = editor.schema.nodes.taskItem;
  } else if (listItem) {
    currentResolved = listItem;
    targetType = editor.schema.nodes.listItem;
  } else {
    const type = $from.node().type;
    currentResolved = findParentNodeOfType(type)(state.selection);
    targetType = type;
  }

  if (!currentResolved) {
    return false;
  }

  const { node: currentNode } = currentResolved;
  const parentDepth = currentResolved.depth - 1;
  const parent = $from.node(parentDepth);
  const parentPos = $from.start(parentDepth);

  if (currentNode.type !== targetType) {
    return false;
  }

  if (
    (targetType === editor.schema.nodes.outlineListItem &&
      parent.type.name !== "outlineList") ||
    (targetType === editor.schema.nodes.taskItem &&
      parent.type.name !== "taskList") ||
    (targetType === editor.schema.nodes.listItem &&
      !["bulletList", "orderedList"].includes(parent.type.name))
  ) {
    return false;
  }

  let arr = mapChildren(parent, (node) => node);
  let index = arr.indexOf(currentNode);
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
