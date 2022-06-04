import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { IconNames, Icons } from "../icons";
import {
  ActionSheetPresenter,
  MenuPresenter,
} from "../../components/menu/menu";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "../components/dropdown";
import { Icon } from "../components/icon";
import { Box, Button, Flex, Text } from "rebass";
import { Popup } from "../components/popup";
import { EmbedPopup } from "../popups/embed-popup";
import { TablePopup } from "../popups/table-popup";
import { MenuItem } from "../../components/menu/types";
import { useToolbarLocation } from "../stores/toolbar-store";
import { DesktopOnly, MobileOnly } from "../../components/responsive";

export function InsertBlock(props: ToolProps) {
  const buttonRef = useRef<HTMLButtonElement | null>();
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();

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

      <DesktopOnly>
        <MenuPresenter
          options={{
            type: "menu",
            position: {
              target: buttonRef.current || undefined,
              isTargetAbsolute: true,
              location: toolbarLocation === "bottom" ? "top" : "below",
              yOffset: 5,
            },
          }}
          isOpen={isOpen}
          items={[
            tasklist(editor),
            horizontalRule(editor),
            codeblock(editor),
            blockquote(editor),
            image(editor),
            attachment(editor),
            embed(editor),
            table(editor),
          ]}
          onClose={() => setIsOpen(false)}
        />
      </DesktopOnly>
      <MobileOnly>
        <ActionSheetPresenter
          isOpen={isOpen}
          items={[
            tasklist(editor),
            horizontalRule(editor),
            codeblock(editor),
            blockquote(editor),
            imageActionSheet(editor),
            attachment(editor),
            embedActionSheet(editor),
            tableActionSheet(editor),
          ]}
          onClose={() => setIsOpen(false)}
        />
      </MobileOnly>
    </>
  );
}

const horizontalRule = (editor: Editor | null): MenuItem => ({
  key: "hr",
  type: "menuitem",
  title: "Horizontal rule",
  icon: "horizontalRule",
  isChecked: editor?.isActive("horizontalRule"),
  onClick: () => editor?.chain().focus().setHorizontalRule().run(),
});

const codeblock = (editor: Editor | null): MenuItem => ({
  key: "codeblock",
  type: "menuitem",
  title: "Code block",
  icon: "codeblock",
  isChecked: editor?.isActive("codeBlock"),
  onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
});

const blockquote = (editor: Editor | null): MenuItem => ({
  key: "blockquote",
  type: "menuitem",
  title: "Quote",
  icon: "blockquote",
  isChecked: editor?.isActive("blockQuote"),
  onClick: () => editor?.chain().focus().toggleBlockquote().run(),
});

const image = (editor: Editor | null): MenuItem => ({
  key: "image",
  type: "menuitem",
  title: "Image",
  icon: "image",
  items: [
    {
      key: "upload-from-disk",
      type: "menuitem",
      title: "Upload from disk",
      icon: "upload",
      onClick: () => {},
    },
    {
      key: "upload-from-url",
      type: "menuitem",
      title: "Attach from URL",
      icon: "link",
      onClick: () => {},
    },
  ],
});

const imageActionSheet = (editor: Editor | null): MenuItem => ({
  key: "image",
  type: "menuitem",
  title: "Image",
  icon: "image",
  items: [
    {
      key: "imageOptions",
      type: "menuitem",
      component: function ({ onClick }) {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <ActionSheetPresenter
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            items={[
              {
                key: "upload-from-disk",
                type: "menuitem",
                title: "Upload from disk",
                icon: "upload",
                onClick: () =>
                  editor?.chain().focus().openAttachmentPicker("image").run(),
              },
              {
                key: "upload-from-url",
                type: "menuitem",
                title: "Attach from URL",
                icon: "link",
                onClick: () => {},
              },
            ]}
          />
        );
      },
    },
  ],
});

const embed = (editor: Editor | null): MenuItem => ({
  key: "embed",
  type: "menuitem",
  title: "Embed",
  icon: "embed",
});

const table = (editor: Editor | null): MenuItem => ({
  key: "table",
  type: "menuitem",
  title: "Table",
  icon: "table",
  items: [
    {
      key: "table-size-selector",
      type: "menuitem",
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
});

const embedActionSheet = (editor: Editor | null): MenuItem => ({
  key: "embed",
  type: "menuitem",
  title: "Embed",
  icon: "embed",
  items: [
    {
      key: "table-size-selector",
      type: "menuitem",
      component: function ({ onClick }) {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <ActionSheetPresenter
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            items={[]}
          >
            <EmbedPopup
              title="Insert embed"
              icon="check"
              onClose={(embed) => {
                editor?.chain().insertEmbed(embed).run();
                setIsOpen(false);
                onClick?.();
              }}
              // embed={props}
              // onSourceChanged={(src) => {}}
              // onSizeChanged={(size) => editor.commands.setEmbedSize(size)}
            />
          </ActionSheetPresenter>
        );
      },
    },
  ],
});

const tableActionSheet = (editor: Editor | null): MenuItem => ({
  key: "table",
  type: "menuitem",
  title: "Table",
  icon: "table",
  items: [
    {
      key: "table-size-selector",
      type: "menuitem",
      component: function ({ onClick }) {
        const [isOpen, setIsOpen] = useState(true);
        return (
          <ActionSheetPresenter
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            items={[]}
          >
            <TablePopup
              cellSize={30}
              autoExpand={false}
              onInsertTable={(size) => {
                editor
                  ?.chain()
                  .focus()
                  .insertTable({
                    rows: size.rows,
                    cols: size.columns,
                  })
                  .run();
                setIsOpen(false);
                onClick?.();
              }}
            />
          </ActionSheetPresenter>
        );
      },
    },
  ],
});

const attachment = (editor: Editor | null): MenuItem => ({
  key: "attachment",
  type: "menuitem",
  title: "Attachment",
  icon: "attachment",
  isChecked: editor?.isActive("attachment"),
  onClick: () => editor?.chain().focus().openAttachmentPicker("file").run(),
});

const tasklist = (editor: Editor | null): MenuItem => ({
  key: "tasklist",
  type: "menuitem",
  title: "Task list",
  icon: "checkbox",
  isChecked: editor?.isActive("taskList"),
  onClick: () => editor?.chain().focus().toggleTaskList().run(),
});
