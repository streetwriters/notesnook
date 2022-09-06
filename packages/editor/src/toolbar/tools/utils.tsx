/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Editor } from "../../types";
import { MenuButton } from "../../components/menu/types";
import { ToolButton } from "../components/tool-button";
import { ToolProps } from "../types";
import { ChainedCommands } from "@tiptap/core";
import { Transaction } from "prosemirror-state";

export function menuButtonToTool(
  constructItem: (editor: Editor) => MenuButton
) {
  return function Tool(props: ToolProps) {
    const item = constructItem(props.editor);
    return (
      <ToolButton
        {...props}
        icon={item.icon || props.icon}
        toggled={item.isChecked || false}
        title={item.title}
        onClick={item.onClick}
      />
    );
  };
}

/**
 * Inserts a paragraph at the end of selection.
 */
function insertParagraphAtTheEndOfSelection(editor: Editor, tr: Transaction) {
  if (!editor.current) return;
  const docSize = editor.current.state.doc.content.size;
  let selectionEnd = tr.selection.to + 1;
  selectionEnd = docSize < selectionEnd ? docSize - 1 : selectionEnd;

  editor?.current
    ?.chain()
    .insertContentAt(selectionEnd, "<p></p>", {
      updateSelection: false
    })
    .run();
}

enum Selection {
  FIRST_PARAGRAPH,
  SECOND_PARAGRAPH
}
/**
 * Inserts two paragraphs and focuses the first or the second based on requirement.
 */
function insertParagraphAfterProposedBlockPosition(
  editor: Editor,
  selection: Selection
) {
  editor?.current
    ?.chain()
    .insertContent("<p></p>", {
      updateSelection: selection === Selection.SECOND_PARAGRAPH
    })
    .insertContent("<p></p>", {
      updateSelection: selection === Selection.FIRST_PARAGRAPH
    })
    .run();
}

/**
 * Inserts a single paragraph
 */
function insertParagraph(editor: Editor, updateSelection: boolean) {
  editor.current
    ?.chain()
    .insertContent("<p></p>", {
      updateSelection: updateSelection
    })
    .run();
}

/**
 * Inserts two paragraphs at given position and selects the first or the second
 */
function insertParagraphsAtPosition(
  editor: Editor,
  position: number,
  selection: Selection
) {
  editor.current
    ?.chain()
    .insertContentAt(position - 1, "<p></p>", {
      updateSelection: selection === Selection.SECOND_PARAGRAPH
    })
    .insertContentAt(position, "<p></p>", {
      updateSelection: selection === Selection.FIRST_PARAGRAPH
    })
    .run();
}

export const insetBlockWithParagraph = (
  editor: Editor,
  commands?: (editor: Editor) => ChainedCommands | undefined
) => {
  const tr = editor.current?.state.tr;
  if (!commands || !tr) return;
  const from = tr.selection.from || 0;
  const currentParagraph = tr.doc.nodeAt(from - 1);
  const nodeSize = currentParagraph?.nodeSize || 0;
  const nextSibling = tr?.doc.nodeAt(from + 1);
  const selectionSize = tr.selection.to - tr.selection.from;

  // case 1: Current node is not empty.
  if (
    nodeSize > 2 ||
    (currentParagraph?.isText &&
      currentParagraph.text &&
      currentParagraph.text.length > 0)
  ) {
    if (!nextSibling) {
      // If text is selected we will insert a single paragraph, then change the current node into the block
      selectionSize > 0
        ? insertParagraphAtTheEndOfSelection(editor, tr)
        : // if selectionSize is 0, we will insert two paragraphs and insert the block in the first one
          insertParagraphAfterProposedBlockPosition(
            editor,
            Selection.FIRST_PARAGRAPH
          );
    } else {
      // if selection size is 0, insert new block only if the cursor is at the end of the node.
      if (selectionSize === 0 && from === tr.selection.$from.end()) {
        insertParagraph(editor, true);
      }
    }
    commands(editor)?.run();

    // case 2: Node is empty but document is not empty
  } else if (nodeSize === 2 && tr?.doc.content.size !== 2) {
    commands(editor)?.run();
    // we will not insert a paragraph if there is a next sibling present
    if (!nextSibling) insertParagraph(editor, true);

    // case 3: Node and document both are empty.
  } else if (nodeSize === 2 && tr?.doc.content.size === 2) {
    const docSize = editor.current?.state.doc.content.size || 0;
    insertParagraphsAtPosition(editor, docSize, Selection.SECOND_PARAGRAPH);
    commands(editor)?.run();
  }
};
