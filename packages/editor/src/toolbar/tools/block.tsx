import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { IconNames, Icons } from "../icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from "../components/dropdown";
import { Icon } from "../components/icon";
import { Box, Button, Flex, Text } from "rebass";
import { Popup } from "../components/popup";
import { EmbedPopup } from "../popups/embed-popup";
import { TablePopup } from "../popups/table-popup";
import { MenuItem } from "../../components/menu/types";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store";
import {
  DesktopOnly,
  MobileOnly,
  ResponsivePresenter,
} from "../../components/responsive";
import { ActionSheetPresenter } from "../../components/action-sheet";
import { getToolbarElement } from "../utils/dom";
import { showPopup } from "../../components/popup-presenter";

export function InsertBlock(props: ToolProps) {
  const buttonRef = useRef<HTMLButtonElement | null>();
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();

  const menuItems = useMemo(() => {
    return [
      tasklist(editor),
      horizontalRule(editor),
      codeblock(editor),
      blockquote(editor),
      image(editor),
      attachment(editor),
      isMobile ? embedMobile(editor) : embedDesktop(editor),
      table(editor),
    ];
  }, [isMobile]);

  return (
    <>
      <Button
        ref={buttonRef}
        sx={{
          p: 1,
          m: 0,
          bg: isOpen ? "hover" : "transparent",
          mr: 1,
          display: "flex",
          alignItems: "center",
          ":hover": { bg: "hover" },
          ":last-of-type": {
            mr: 0,
          },
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen((s) => !s)}
      >
        <Icon path={Icons.plus} size={18} color={"primary"} />
      </Button>

      <ResponsivePresenter
        desktop="menu"
        mobile="sheet"
        title="Choose a block to insert"
        isOpen={isOpen}
        items={menuItems}
        onClose={() => setIsOpen(false)}
        position={{
          target: buttonRef.current || undefined,
          isTargetAbsolute: true,
          location: toolbarLocation === "bottom" ? "top" : "below",
          yOffset: 5,
        }}
      />
    </>
  );
}

const horizontalRule = (editor: Editor | null): MenuItem => ({
  key: "hr",
  type: "button",
  title: "Horizontal rule",
  icon: "horizontalRule",
  isChecked: editor?.isActive("horizontalRule"),
  onClick: () => editor?.chain().focus().setHorizontalRule().run(),
});

const codeblock = (editor: Editor | null): MenuItem => ({
  key: "codeblock",
  type: "button",
  title: "Code block",
  icon: "codeblock",
  isChecked: editor?.isActive("codeBlock"),
  onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
});

const blockquote = (editor: Editor | null): MenuItem => ({
  key: "blockquote",
  type: "button",
  title: "Quote",
  icon: "blockquote",
  isChecked: editor?.isActive("blockQuote"),
  onClick: () => editor?.chain().focus().toggleBlockquote().run(),
});

const image = (editor: Editor | null): MenuItem => ({
  key: "image",
  type: "button",
  title: "Image",
  icon: "image",
  menu: {
    title: "Insert an image",
    items: [
      {
        key: "upload-from-disk",
        type: "button",
        title: "Upload from disk",
        icon: "upload",
        onClick: () => {},
      },
      {
        key: "upload-from-url",
        type: "button",
        title: "Attach from URL",
        icon: "link",
        onClick: () => {},
      },
    ],
  },
});

const table = (editor: Editor | null): MenuItem => ({
  key: "table",
  type: "button",
  title: "Table",
  icon: "table",
  menu: {
    title: "Insert a table",
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
                  cols: size.columns,
                })
                .run();
              props.onClick?.();
            }}
          />
        ),
      },
    ],
  },
});

const embedMobile = (editor: Editor | null): MenuItem => ({
  key: "embed",
  type: "button",
  title: "Embed",
  icon: "embed",
  menu: {
    title: "Insert an embed",
    items: [
      {
        key: "embed-popup",
        type: "popup",
        component: function ({ onClick }) {
          return (
            <EmbedPopup
              title="Insert embed"
              onClose={(embed) => {
                if (!embed) return onClick?.();
                editor?.chain().insertEmbed(embed).run();
                onClick?.();
              }}
            />
          );
        },
      },
    ],
  },
});

const embedDesktop = (editor: Editor | null): MenuItem => ({
  key: "embed",
  type: "button",
  title: "Embed",
  icon: "embed",
  onClick: () => {
    if (!editor) return;
    showPopup({
      theme: editor.storage.theme,
      popup: (hide) => (
        <EmbedPopup
          title="Insert embed"
          onClose={(embed) => {
            if (!embed) return hide();
            editor?.chain().insertEmbed(embed).run();
            hide();
          }}
        />
      ),
    });
  },
});

const attachment = (editor: Editor | null): MenuItem => ({
  key: "attachment",
  type: "button",
  title: "Attachment",
  icon: "attachment",
  isChecked: editor?.isActive("attachment"),
  onClick: () => editor?.chain().focus().openAttachmentPicker("file").run(),
});

const tasklist = (editor: Editor | null): MenuItem => ({
  key: "tasklist",
  type: "button",
  title: "Task list",
  icon: "checkbox",
  isChecked: editor?.isActive("taskList"),
  onClick: () => editor?.chain().focus().toggleTaskList().run(),
});
