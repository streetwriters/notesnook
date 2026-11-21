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

import { showPopup } from "../../components/popup-presenter/index.js";
import { NODE_NAMES } from "../../extension-types.js";
import type { EditorController } from "../../controller.js";
import { getHostAction } from "../../host.js";
import { findOffsetMark, q } from "../../queries/queries.js";
import { isInternalLink, LinkPopup } from "./link-popup.js";

/** Asks the host for a note to link to and links the selection to it. */
export async function insertInternalLink(editor: EditorController) {
  const link = await getHostAction(editor, "createInternalLink")?.();
  if (!link) return;
  const selectedText = editor.queries.read(q.selectedText()) ?? "";
  editor.run({
    name: "setLink",
    args: [{ ...link, title: selectedText || link.title }]
  });
}

/**
 * The insert / edit link popup (the keyboard shortcut). Reads what it needs
 * from the controller at the moment it opens.
 */
export async function showLinkPopup(editor: EditorController) {
  const { read } = editor.queries;
  const isActive = read(q.isActive(NODE_NAMES.link)) ?? false;
  const isImageActive = read(q.isActive(NODE_NAMES.image)) ?? false;
  const selectedNode = read(q.selectionOffset());
  const link = findOffsetMark(selectedNode, NODE_NAMES.link);
  const attrs = (link?.attrs ?? read(q.attributes(NODE_NAMES.link)) ?? {}) as {
    href?: string;
    title?: string;
  };
  const selectedText = read(q.selectedText()) ?? "";

  if (isInternalLink(attrs.href)) {
    const next = await getHostAction(
      editor,
      "createInternalLink"
    )?.({
      href: attrs.href as string,
      title: attrs.title
    });
    if (!next) return;
    if (isActive) {
      const caret = read(q.selection());
      editor.run(
        ...(selectedNode
          ? [
              {
                name: "setTextSelection",
                args: [{ from: selectedNode.from, to: selectedNode.to }]
              }
            ]
          : []),
        { name: "setLink", args: [next] },
        ...(selectedNode && caret
          ? [
              {
                name: "setTextSelection",
                args: [{ from: caret.from, to: caret.to }]
              }
            ]
          : [])
      );
    } else {
      editor.run({
        name: "setLink",
        args: [{ ...next, title: selectedText || next.title }]
      });
    }
    return;
  }

  showPopup({
    popup: (close) => (
      <LinkPopup
        link={
          selectedNode
            ? {
                title: isActive ? selectedNode.text : selectedText,
                href: (link?.attrs.href as string | undefined) || ""
              }
            : undefined
        }
        onClose={close}
        onDone={(link) => {
          if (isActive) {
            editor.run(
              ...(selectedNode
                ? [
                    {
                      name: "setTextSelection",
                      args: [{ from: selectedNode.from, to: selectedNode.to }]
                    }
                  ]
                : []),
              { name: "setLink", args: [link] }
            );
          } else editor.run({ name: "toggleLink", args: [link] });
          close();
        }}
        isEditing={isActive}
        isImageActive={isImageActive}
      />
    ),
    mobile: "sheet",
    desktop: "popup",
    editor,
    anchor: "selection",
    placement: "bottom-start"
  });
}
