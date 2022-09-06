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

export const insetBlockWithParagraph = (
  editor: Editor,
  commands?: (editor: Editor) => ChainedCommands | undefined
) => {
  if (!commands) return;
  const tr = editor.current?.state.tr;
  const from = tr?.selection.from || 0;
  const currentParagraph = tr?.doc.nodeAt(from - 1);
  const nodeSize = currentParagraph?.nodeSize || 0;

  if (nodeSize > 2) {
    editor?.current
      ?.chain()
      .insertContent("<p></p>", {
        updateSelection: false
      })
      .insertContent("<p></p>", {
        updateSelection: true
      })
      .run();
    commands(editor)?.run();
  } else if (nodeSize === 2 && tr?.doc.content.size !== 2) {
    commands(editor)?.run();
    const nextSibling = tr?.doc.nodeAt(from + 1);
    if (!nextSibling) {
      editor.current
        ?.chain()
        .insertContent("<p></p>", {
          updateSelection: true
        })
        .run();
    }
  } else if (nodeSize === 2 && tr?.doc.content.size === 2) {
    const lastPosition = editor.current?.state.doc.content.size || 0;
    editor.current
      ?.chain()
      .insertContentAt(lastPosition - 1, "<p></p>", {
        updateSelection: true
      })
      .insertContentAt(lastPosition, "<p></p>", {
        updateSelection: false
      })
      .run();
    commands(editor)?.run();
  }
};
