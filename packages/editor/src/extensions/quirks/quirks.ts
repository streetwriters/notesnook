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

import { Editor, Extension, findParentNode } from "@tiptap/core";
import { EditorState, Selection } from "@tiptap/pm/state";
import { isAndroid } from "../../utils/platform.js";

export type QuirksOptions = {
  /**
   * List of node types that do not get removed on pressing Backspace
   * even when they are empty.
   */
  irremovableNodesOnBackspace: string[];

  /**
   * Nodes that should be easily escapable if at the beginning of the
   * document by pressing the ArrowUp key. Pressing the ArrowUp key
   * will create an empty paragraph before the node.
   */
  escapableNodesIfAtDocumentStart: string[];
};

export const Quirks = Extension.create<QuirksOptions>({
  name: "quirks",
  addOptions() {
    return {
      escapableNodesIfAtDocumentStart: [],
      irremovableNodesOnBackspace: []
    };
  },

  addKeyboardShortcuts() {
    return {
      // exit node on arrow up
      ArrowUp: ({ editor }) =>
        escapeNode(editor, this.options.escapableNodesIfAtDocumentStart),
      ArrowLeft: ({ editor }) =>
        escapeNode(editor, this.options.escapableNodesIfAtDocumentStart, "ltr"),
      ArrowRight: ({ editor }) =>
        escapeNode(editor, this.options.escapableNodesIfAtDocumentStart, "rtl"),

      Backspace: ({ editor }) => {
        const { empty, $anchor } = editor.state.selection;

        const nextNode = editor.state.doc.nodeAt($anchor.pos + 1);
        const node = findFromParentNode(
          editor.state,
          this.options.irremovableNodesOnBackspace
        );

        if (!empty) {
          return false;
        }

        if (node && !node.node.textContent.length) {
          return this.editor.commands.deleteNode(node.node.type);
        }
        // on android due to composition issues with various keyboards,
        // sometimes backspace is detected one node behind. We need to
        // manually handle this case.
        else if (
          isAndroid &&
          nextNode &&
          this.options.irremovableNodesOnBackspace.includes(
            nextNode.type.name
          ) &&
          !nextNode.textContent.length
        ) {
          return this.editor.commands.command(({ tr }) => {
            tr.delete($anchor.pos + 1, $anchor.pos + 1 + nextNode.nodeSize);
            return true;
          });
        }

        return false;
      }
    };
  }
});

const findFromParentNode = (state: EditorState, types: string[]) => {
  return findParentNode((node) => types.includes(node.type.name))(
    state.selection
  );
};

function escapeNode(
  editor: Editor,
  escapableNodes: string[],
  mode?: "ltr" | "rtl"
) {
  const { state } = editor;
  const { selection } = state;
  const { $anchor, empty } = selection;
  const documentStartPos = Selection.atStart(editor.state.doc).$head.pos;
  const node = findFromParentNode(state, escapableNodes);

  const isAtStart = $anchor.pos === documentStartPos;

  if (!empty || !isAtStart || !node) {
    return false;
  }
  const textDirection = node.node.attrs.textDirection;
  if (mode === "ltr" && !!textDirection) return false;
  if (mode === "rtl" && textDirection !== "rtl") return false;

  return editor.commands.insertContentAt(
    0,
    `<p ${textDirection ? `dir="${textDirection}"` : ""}></p>`
  );
}
