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

import { q, useEditorQuery } from "../../queries/index.js";
import { TiptapToolProps as ToolProps } from "../types.js";
import { Editor, hasPermission } from "../../types.js";
import { Icons } from "../icons.js";
import { useMemo, useRef, useState } from "react";
import { EmbedPopup } from "../popups/embed-popup.js";
import { TablePopup } from "../popups/table-popup.js";
import { Icon, type MenuItem, type UIElement } from "@ui";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { showPopup } from "../../components/popup-presenter/index.js";
import { ImageUploadPopup } from "../popups/image-upload.js";
import { Button } from "../../components/button.js";
import { strings } from "@notesnook/intl";
import { keybindings } from "@notesnook/common";
import { tableActions } from "../../table-actions.js";
import { callHostAction, hasHostAction } from "../../host.js";

type BlockState = {
  taskList: boolean;
  outlineList: boolean;
  horizontalRule: boolean;
  codeBlock: boolean;
  mathBlock: boolean;
  blockQuote: boolean;
  attachment: boolean;
  calloutType: string | undefined;
};

function useBlockState(editor: Editor): BlockState {
  const taskList = useEditorQuery(editor, q.isActive("taskList"), false);
  const outlineList = useEditorQuery(editor, q.isActive("outlineList"), false);
  const horizontalRule = useEditorQuery(
    editor,
    q.isActive("horizontalRule"),
    false
  );
  const codeBlock = useEditorQuery(editor, q.isActive("codeBlock"), false);
  const mathBlock = useEditorQuery(editor, q.isActive("mathBlock"), false);
  const blockQuote = useEditorQuery(editor, q.isActive("blockQuote"), false);
  const attachment = useEditorQuery(editor, q.isActive("attachment"), false);
  const calloutType = useEditorQuery(editor, q.attributes("callout"), {}).type;
  return useMemo(
    () => ({
      taskList,
      outlineList,
      horizontalRule,
      codeBlock,
      mathBlock,
      blockQuote,
      attachment,
      calloutType
    }),
    [
      taskList,
      outlineList,
      horizontalRule,
      codeBlock,
      mathBlock,
      blockQuote,
      attachment,
      calloutType
    ]
  );
}

export function InsertBlock(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<UIElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();
  const state = useBlockState(editor);

  const menuItems = useMemo(() => {
    return [
      tasklist(editor, state),
      outlinelist(editor, state),
      horizontalRule(editor, state),
      codeblock(editor, state),
      mathblock(editor, state),
      callout(editor, state),
      blockquote(editor, state),
      image(editor, isMobile),
      attachment(editor, state),
      isMobile ? embedMobile(editor) : embedDesktop(editor),
      table(editor)
    ];
  }, [editor, isMobile, state]);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        testID="tool-insertBlock"
        sx={{
          p: 1,
          m: 0,
          bg: isOpen ? "background-secondary" : "transparent",
          mr: 1,
          alignItems: "center"
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

const horizontalRule = (editor: Editor, state: BlockState): MenuItem => ({
  key: "hr",
  type: "button",
  title: strings.horizontalRule(),
  icon: Icons.horizontalRule,
  isChecked: state.horizontalRule,
  onClick: () => editor.chain().focus().setHorizontalRule().run()
});

const codeblock = (editor: Editor, state: BlockState): MenuItem => ({
  key: "codeblock",
  type: "button",
  title: strings.codeBlock(),
  icon: Icons.codeblock,
  isChecked: state.codeBlock,
  onClick: () => editor.chain().focus().toggleCodeBlock().run(),
  modifier: keybindings.toggleCodeBlock.keys
});

const blockquote = (editor: Editor, state: BlockState): MenuItem => ({
  key: "blockquote",
  type: "button",
  title: strings.quote(),
  icon: Icons.blockquote,
  isChecked: state.blockQuote,
  onClick: () => editor.chain().focus().toggleBlockquote().run(),
  modifier: keybindings.insertBlockquote.keys
});

const mathblock = (editor: Editor, state: BlockState): MenuItem => ({
  key: "math",
  type: "button",
  title: strings.mathAndFormulas(),
  icon: Icons.mathBlock,
  isChecked: state.mathBlock,
  onClick: () => editor.chain().focus().insertMathBlock().run(),
  modifier: keybindings.insertMathBlock.keys
});

const callout = (editor: Editor, state: BlockState): MenuItem => ({
  key: "callout",
  type: "button",
  title: strings.callout(),
  icon: Icons.callout,
  menu: {
    title: strings.callout(),
    items: [
      { key: "Abstract", title: strings.abstract() },
      { key: "Hint", title: strings.hint() },
      { key: "Info", title: strings.info() },
      { key: "Success", title: strings.success() },
      { key: "Warn", title: strings.warn() },
      { key: "Error", title: strings.error() },
      { key: "Example", title: strings.example() },
      { key: "Quote", title: strings.quote() }
    ].map((item) => ({
      title: item.title,
      key: item.key,
      type: "button",
      isChecked: state.calloutType === item.key.toLowerCase(),
      onClick: () =>
        editor
          .chain()
          .focus()
          .setCallout({ type: item.key.toLowerCase() as any })
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
        isHidden: !hasHostAction(editor, "openAttachmentPicker"),
        onClick: () => callHostAction(editor, "openAttachmentPicker", "image"),
        modifier: keybindings.addImage.keys
      },
      {
        key: "camera",
        type: "button",
        title: strings.takePhotoUsingCamera(),
        icon: Icons.camera,
        isHidden: !isMobile || !hasHostAction(editor, "openAttachmentPicker"),
        onClick: () => callHostAction(editor, "openAttachmentPicker", "camera")
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
        key: "import-csv",
        type: "button",
        title: strings.importCsv(),
        icon: Icons.csv,
        onClick: async () => {
          if (!hasPermission("importCsvToTable")) return;

          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,text/csv";
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
              const text = await file.text();
              tableActions.importCsvToTable(text, editor);
            } catch (error) {
              console.error("Error importing CSV:", error);
            }
          };

          input.click();
        }
      },
      {
        key: "sep",
        type: "separator"
      },
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

const attachment = (editor: Editor, state: BlockState): MenuItem => ({
  key: "attachment",
  type: "button",
  title: strings.attachment(),
  icon: Icons.attachment,
  isChecked: state.attachment,
  isHidden: !hasHostAction(editor, "openAttachmentPicker"),
  onClick: () => callHostAction(editor, "openAttachmentPicker", "file"),
  modifier: keybindings.addAttachment.keys
});

const tasklist = (editor: Editor, state: BlockState): MenuItem => ({
  key: "tasklist",
  type: "button",
  title: strings.taskList(),
  icon: Icons.checkbox,
  isChecked: state.taskList,
  onClick: () => editor.chain().focus().toggleTaskList().run(),
  modifier: keybindings.toggleTaskList.keys
});

const outlinelist = (editor: Editor, state: BlockState): MenuItem => ({
  key: "outlinelist",
  type: "button",
  title: strings.outlineList(),
  icon: Icons.outlineList,
  isChecked: state.outlineList,
  onClick: () => editor.chain().focus().toggleOutlineList().run(),
  modifier: keybindings.toggleOutlineList.keys
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
              editor?.chain().focus().insertImage(image).run();
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
            editor?.chain().focus().insertImage(image).run();
            hide();
          }}
          onClose={hide}
        />
      )
    });
  }
});
