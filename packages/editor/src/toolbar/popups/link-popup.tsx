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

import { Input, Text } from "@theme-ui/components";
import { Flex } from "@theme-ui/components";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { Popup } from "../components/popup.js";
import { isInternalLink, LinkDefinition } from "../tools/link.js";
import { showPopup } from "../../components/popup-presenter/index.js";
import Link, { LinkAttributes } from "../../extensions/link/index.js";
import { ImageNode } from "../../extensions/image/index.js";
import { findMark, selectionToOffset } from "../../utils/prosemirror.js";
import { Editor, getMarkAttributes } from "@tiptap/core";
import { strings } from "@notesnook/intl";

export type LinkPopupProps = {
  link?: LinkDefinition;
  isEditing?: boolean;
  onDone: (link: LinkDefinition) => void;
  onClose: () => void;
  isImageActive?: boolean;
};
export function LinkPopup(props: LinkPopupProps) {
  const {
    link: _link = { title: "", href: "" },
    isEditing = false,
    onDone,
    onClose,
    isImageActive
  } = props;
  const link = useRefValue(_link);

  return (
    <Popup
      title={isEditing ? strings.editLink() : strings.insertLink()}
      onClose={onClose}
      action={{
        title: isEditing ? strings.save() : strings.insert(),
        onClick: () => onDone(link.current)
      }}
    >
      <Flex
        sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            onDone(link.current);
          }
        }}
      >
        {!isImageActive && (
          <>
            <Text
              sx={{
                mb: 1,
                ml: 1,
                fontSize: "body",
                color: "paragraph"
              }}
            >
              {strings.linkText()}
            </Text>
            <Input
              type="text"
              placeholder={strings.linkText()}
              defaultValue={link.current?.title}
              sx={{ mb: 2 }}
              onChange={(e) =>
                (link.current = {
                  ...link.current,
                  title: e.target.value
                })
              }
            />
          </>
        )}
        <Text
          sx={{
            mb: 1,
            ml: 1,
            fontSize: "body",
            color: "paragraph"
          }}
        >
          {strings.url()}
        </Text>
        <Input
          type="url"
          autoFocus
          placeholder="https://example.com/"
          defaultValue={link.current?.href}
          onChange={(e) =>
            (link.current = { ...link.current, href: e.target.value })
          }
        />
      </Flex>
    </Popup>
  );
}

export async function showLinkPopup(editor: Editor) {
  const isActive = editor.isActive(Link.name);
  const isImageActive = editor.isActive(ImageNode.name);
  const selectedNode = selectionToOffset(editor.state);
  const link = selectedNode?.node
    ? findMark(selectedNode.node, Link.name)
    : null;
  const attrs = link?.attrs || getMarkAttributes(editor.state, Link.name);
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
    desktop: "popup"
  });
}
