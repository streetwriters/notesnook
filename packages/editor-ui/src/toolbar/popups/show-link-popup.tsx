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

import { Editor, getMarkAttributes } from "@tiptap/core";
import { showPopup } from "../../components/popup-presenter/index.js";
import { LinkAttributes, NODE_NAMES } from "../../extension-types.js";
import { findMark, selectionToOffset } from "../../utils/prosemirror.js";
import { isInternalLink, LinkPopup } from "./link-popup.js";

export async function showLinkPopup(editor: Editor) {
  const isActive = editor.isActive(NODE_NAMES.link);
  const isImageActive = editor.isActive(NODE_NAMES.image);
  const selectedNode = selectionToOffset(editor.state);
  const link = selectedNode?.node
    ? findMark(selectedNode.node, NODE_NAMES.link)
    : null;
  const attrs = link?.attrs || getMarkAttributes(editor.state, NODE_NAMES.link);
  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to
  );
  if (isInternalLink(attrs.href)) {
    const link = await editor.storage.createInternalLink?.(
      attrs as LinkAttributes
    );
    if (!link) return;
    if (isActive) {
      const { from, to } = editor.state.selection;
      if (selectedNode) editor.commands.setTextSelection(selectedNode);
      editor.commands.setLink(link);
      if (selectedNode) editor.commands.setTextSelection({ from, to });
    } else {
      editor.commands.setLink({ ...link, title: selectedText || link.title });
    }
    return;
  }

  showPopup({
    popup: (close) => (
      <LinkPopup
        link={
          selectedNode && selectedNode.node
            ? {
                title: isActive ? selectedNode.node.textContent : selectedText,
                href: link?.attrs.href || ""
              }
            : undefined
        }
        onClose={close}
        onDone={(link) => {
          if (isActive) {
            if (selectedNode)
              editor.chain().focus().setTextSelection(selectedNode).run();
            editor.commands.setLink(link);
          } else editor.commands.toggleLink(link);
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
