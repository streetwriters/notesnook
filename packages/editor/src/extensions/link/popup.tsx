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

import { showPopup } from "../../components/popup-presenter";
import { Button, Flex, Input, Text } from "@theme-ui/components";
import { PopupWrapper } from "../../components/popup-presenter";
import { Icon } from "@notesnook/ui";
import { useState } from "react";
import { Icons } from "../../toolbar";
import { getToolbarElement } from "../../toolbar/utils/dom";
import { useToolbarLocation } from "../../toolbar/stores/toolbar-store";
import { Editor } from "@tiptap/core";
import { TextSelection } from "prosemirror-state";

type LinkFloatingMenu = {
  onClose: () => void;
  isOpen: boolean;
  editor: Editor;
};

export function LinkFloatingMenu(props: LinkFloatingMenu) {
  const { onClose, isOpen, editor } = props;
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const [open, setOpen] = useState(true);
  const [href, setHref] = useState("");
  const [text, setText] = useState("");

  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to);

  return (
    <PopupWrapper
      group="link-floating-menu"
      id="link-floating-menu"
      isOpen={open}
      position={{
        isTargetAbsolute: true,
        target: getToolbarElement(),
        align: "center",
        location: isBottom ? "top" : "below",
        yOffset: 10
      }}
    >
      <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
        <Flex
          className="movable"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            p: 2
          }}
        >
          <Text variant={"title"}>Insert Link</Text>
          <Button
            variant={"secondary"}
            sx={{ p: 0, bg: "transparent" }}
            onClick={() => setOpen(false)}
          >
            <Icon path={Icons.close} size={"big"} />
          </Button>
        </Flex>
        <Input
          type="text"
          placeholder="Link text"
          defaultValue={selectedText}
          sx={{ mb: 1 }}
          onChange={
            (e) => {
              setText(e.target.value);
            }
            //(link.current = { ...link.current, text: e.target.value })
          }
        />
        <Input
          type="url"
          autoFocus
          placeholder="https://example.com/"
          defaultValue={href}
          onChange={
            (e) => {
              setHref(e.target.value);
            }
            //(link.current = { ...link.current, href: e.target.value })
          }
        />
      </Flex>
      <Flex
        sx={{ justifyContent: "end" }}
        bg="var(--background-secondary)"
        p={1}
        px={2}
        mt={2}
      >
        <Button
          variant="dialog"
          onClick={() => {
            if (text !== "")
              editor
                .chain()
                .command(({ tr }) => {
                  tr.insertText(text, tr.mapping.map(from), tr.mapping.map(to));
                  tr.setSelection(
                    TextSelection.create(
                      tr.doc,
                      tr.mapping.map(from),
                      tr.mapping.map(to)
                    )
                  );
                  return true;
                })
                .focus()
                .run();

            editor
              .chain()
              .setMark("link")
              .setLink({ href, target: "_blank" })
              .run();

            setOpen(false);
          }}
        >
          Insert Link
        </Button>
      </Flex>
    </PopupWrapper>
  );
}

type linkPopup = {
  editor: Editor;
};

export function showLinkPopup(props: linkPopup) {
  showPopup({
    popup: () => (
      <LinkFloatingMenu
        onClose={() => console.log("onClose")}
        isOpen={true}
        editor={props.editor}
      />
    )
  });
}
