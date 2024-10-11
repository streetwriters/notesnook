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

import { ToolProps } from "../types.js";
import { Editor } from "../../types.js";
import { Icons } from "../icons.js";
import { useMemo, useRef, useState } from "react";
import { EmbedPopup } from "../popups/embed-popup.js";
import { TablePopup } from "../popups/table-popup.js";
import { MenuItem, Icon } from "@notesnook/ui";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { showPopup } from "../../components/popup-presenter/index.js";
import { ImageUploadPopup } from "../popups/image-upload.js";
import { Button } from "../../components/button.js";
import { strings } from "@notesnook/intl";

export function InsertBlock(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();

  const menuItems = useMemo(() => {
    return [
      tasklist(editor),
      outlinelist(editor),
      horizontalRule(editor),
      codeblock(editor),
      mathblock(editor),
      callout(editor),
      blockquote(editor),
      image(editor, isMobile),
      attachment(editor),
      isMobile ? embedMobile(editor) : embedDesktop(editor),
      table(editor)
    ];
  }, [editor, isMobile]);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        sx={{
          p: 1,
          m: 0,
          bg: isOpen ? "var(--background-secondary)" : "transparent",
          mr: 1,
          display: "flex",
          alignItems: "center",
          ":last-of-type": {
            mr: 0
          }
        }}
        onMouseDown={(e) => {
          if (globalThis.keyboardShown) {
            e.preventDefault();
          }
        }}
        onClick={() => setIsOpen((s) => !s)}
      >
        <Icon path={Icons.plus} size="medium" color={"accent"} />
      </Button>

      <ResponsivePresenter
        desktop="menu"
        mobile="sheet"
        title={strings.chooseBlockToInsert()}
        isOpen={isOpen}
        items={menuItems}
        onClose={() => setIsOpen(false)}
        position={{
          target: buttonRef.current || undefined,
          isTargetAbsolute: true,
          location: toolbarLocation === "bottom" ? "top" : "below",
          yOffset: 5
        }}
      />
    </>
  );
}

const horizontalRule = (editor: Editor): MenuItem => ({
  key: "hr",
  type: "button",
  title: strings.horizontalRule(),
  icon: Icons.horizontalRule,
  isChecked: editor.isActive("horizontalRule"),
  onClick: () => editor.chain().focus().setHorizontalRule().run()
});

const codeblock = (editor: Editor): MenuItem => ({
  key: "codeblock",
  type: "button",
  title: strings.codeBlock(),
  icon: Icons.codeblock,
  isChecked: editor.isActive("codeBlock"),
  onClick: () => editor.chain().focus().toggleCodeBlock().run(),
  modifier: "Mod-Shift-C"
});

const blockquote = (editor: Editor): MenuItem => ({
  key: "blockquote",
  type: "button",
  title: strings.quote(),
  icon: Icons.blockquote,
  isChecked: editor.isActive("blockQuote"),
  onClick: () => editor.chain().focus().toggleBlockquote().run(),
  modifier: "Mod-Shift-B"
});

const mathblock = (editor: Editor): MenuItem => ({
  key: "math",
  type: "button",
  title: strings.mathAndFormulas(),
  icon: Icons.mathBlock,
  isChecked: editor.isActive("mathBlock"),
  onClick: () => editor.chain().focus().insertMathBlock().run(),
  modifier: "Mod-Shift-M"
});

const callout = (editor: Editor): MenuItem => ({
  key: "callout",
  type: "button",
  title: strings.callout(),
  icon: Icons.callout,
  menu: {
    items: [
      "Abstract",
      "Hint",
      "Info",
      "Success",
      "Warn",
      "Error",
      "Example",
      "Quote"
    ].map((type) => ({
      title: type,
      key: type,
      type: "button",
      isChecked: editor.isActive("callout", { type: type.toLowerCase() }),
      onClick: () =>
        editor
          .chain()
          .focus()
          .setCallout({ type: type.toLowerCase() as any })
          .run()
    }))
  }
});

const image = (editor: Editor, isMobile: boolean): MenuItem => ({
  key: "image",
  type: "button",
  title: strings.image(),
  icon: Icons.image,
  menu: {
    title: strings.insertImage(),
    items: [
      {
        key: "upload-from-disk",
        type: "button",
        title: strings.uploadFromDisk(),
        icon: Icons.upload,
        onClick: () => editor.storage.openAttachmentPicker?.("image"),
        modifier: "Mod-Shift-I"
      },
      {
        key: "camera",
        type: "button",
        title: strings.takePhotoUsingCamera(),
        icon: Icons.camera,
        isHidden: !isMobile,
        onClick: () => editor.storage.openAttachmentPicker?.("camera")
      },
      isMobile ? uploadImageFromURLMobile(editor) : uploadImageFromURL(editor)
    ]
  }
});

const table = (editor: Editor): MenuItem => ({
  key: "table",
  type: "button",
  title: strings.table(),
  icon: Icons.table,
  menu: {
    title: strings.insertTable(),
    items: [
      {
        key: "table-size-selector",
        type: "popup",
        component: (props) => (
          <TablePopup
            onInsertTable={(size) => {
              editor
                ?.chain()
                .focus()
                .insertTable({
                  rows: size.rows,
                  cols: size.columns
                })
                .run();
              props.onClick?.();
            }}
          />
        )
      }
    ]
  }
});

const embedMobile = (editor: Editor): MenuItem => ({
  key: "embed",
  type: "button",
  title: strings.embed(),
  icon: Icons.embed,
  menu: {
    title: strings.insertEmbed(),
    items: [
      {
        key: "embed-popup",
        type: "popup",
        component: function ({ onClick }) {
          return (
            <EmbedPopup
              title={strings.insertEmbed()}
              onClose={(embed) => {
                if (!embed) return onClick?.();
                editor.chain().insertEmbed(embed).run();
                onClick?.();
              }}
            />
          );
        }
      }
    ]
  }
});

const embedDesktop = (editor: Editor): MenuItem => ({
  key: "embed",
  type: "button",
  title: strings.embed(),
  icon: Icons.embed,
  onClick: () => {
    if (!editor) return;
    showPopup({
      popup: (hide) => (
        <EmbedPopup
          title={strings.insertEmbed()}
          onClose={(embed) => {
            if (!embed) return hide();
            editor.chain().insertEmbed(embed).run();
            hide();
          }}
        />
      )
    });
  }
});

const attachment = (editor: Editor): MenuItem => ({
  key: "attachment",
  type: "button",
  title: strings.attachment(),
  icon: Icons.attachment,
  isChecked: editor.isActive("attachment"),
  onClick: () => editor.storage.openAttachmentPicker?.("file"),
  modifier: "Mod-Shift-A"
});

const tasklist = (editor: Editor): MenuItem => ({
  key: "tasklist",
  type: "button",
  title: strings.taskList(),
  icon: Icons.checkbox,
  isChecked: editor.isActive("taskList"),
  onClick: () => editor.chain().focus().toggleTaskList().run(),
  modifier: "Mod-Shift-T"
});

const outlinelist = (editor: Editor): MenuItem => ({
  key: "outlinelist",
  type: "button",
  title: strings.outlineList(),
  icon: Icons.outlineList,
  isChecked: editor.isActive("outlineList"),
  onClick: () => editor.chain().focus().toggleOutlineList().run(),
  modifier: "Mod-Shift-O"
});

const uploadImageFromURLMobile = (editor: Editor): MenuItem => ({
  key: "upload-from-url",
  type: "button",
  title: strings.attachImageFromURL(),
  icon: Icons.link,
  menu: {
    title: strings.attachImageFromURL(),
    items: [
      {
        key: "attach-image",
        type: "popup",
        component: ({ onClick }) => (
          <ImageUploadPopup
            onInsert={(image) => {
              editor
                .requestPermission("insertImage")
                ?.chain()
                .focus()
                .insertImage(image)
                .run();
              onClick?.();
            }}
            onClose={() => {
              onClick?.();
            }}
          />
        )
      }
    ]
  }
});

const uploadImageFromURL = (editor: Editor): MenuItem => ({
  key: "upload-from-url",
  type: "button",
  title: strings.attachImageFromURL(),
  icon: Icons.link,
  onClick: () => {
    showPopup({
      popup: (hide) => (
        <ImageUploadPopup
          onInsert={(image) => {
            editor
              .requestPermission("insertImage")
              ?.chain()
              .focus()
              .insertImage(image)
              .run();
            hide();
          }}
          onClose={hide}
        />
      )
    });
  }
});
