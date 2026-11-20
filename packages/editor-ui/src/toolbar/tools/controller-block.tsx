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

import { useMemo, useRef, useState } from "react";
import { Icon, type MenuItem, type UIElement } from "@ui";
import { strings } from "@notesnook/intl";
import { keybindings } from "@notesnook/common";
import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import type { EditorController } from "../../controller.js";
import { ToolProps } from "../types.js";
import { Icons } from "../icons.js";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { showPopup } from "../../components/popup-presenter/index.js";
import { Button } from "../../components/button.js";
import { EmbedPopup } from "../popups/embed-popup.js";
import { TablePopup } from "../popups/table-popup.js";
import { ImageUploadPopup } from "../popups/image-upload.js";

const CALLOUTS = [
  { key: "abstract", title: () => strings.abstract() },
  { key: "hint", title: () => strings.hint() },
  { key: "info", title: () => strings.info() },
  { key: "success", title: () => strings.success() },
  { key: "warn", title: () => strings.warn() },
  { key: "error", title: () => strings.error() },
  { key: "example", title: () => strings.example() },
  { key: "quote", title: () => strings.quote() }
];

function useBlockState(editor: EditorController) {
  return {
    taskList: useEditorQuery(editor, q.isActive("taskList"), false),
    outlineList: useEditorQuery(editor, q.isActive("outlineList"), false),
    horizontalRule: useEditorQuery(editor, q.isActive("horizontalRule"), false),
    codeBlock: useEditorQuery(editor, q.isActive("codeBlock"), false),
    mathBlock: useEditorQuery(editor, q.isActive("mathBlock"), false),
    blockQuote: useEditorQuery(editor, q.isActive("blockQuote"), false),
    attachment: useEditorQuery(editor, q.isActive("attachment"), false),
    calloutType: useEditorQuery(editor, q.attributes("callout"), {}).type as
      | string
      | undefined,
    canMathBlock: useEditorQuery(editor, q.can("insertMathBlock"), false)
  };
}

export function ControllerInsertBlock(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<UIElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();
  const state = useBlockState(editor);
  const picker = editor.hostActions?.openAttachmentPicker;

  const {
    taskList,
    outlineList,
    horizontalRule,
    codeBlock,
    mathBlock,
    blockQuote,
    attachment,
    calloutType,
    canMathBlock
  } = state;

  const menuItems = useMemo<MenuItem[]>(() => {
    const run = (name: string, ...args: unknown[]) => () =>
      editor.run({ name, args });
    return [
      {
        key: "tasklist",
        type: "button",
        title: strings.taskList(),
        icon: Icons.checkbox,
        isChecked: taskList,
        onClick: run("toggleTaskList"),
        modifier: keybindings.toggleTaskList.keys
      },
      {
        key: "outlinelist",
        type: "button",
        title: strings.outlineList(),
        icon: Icons.outlineList,
        isChecked: outlineList,
        onClick: run("toggleOutlineList"),
        modifier: keybindings.toggleOutlineList.keys
      },
      {
        key: "hr",
        type: "button",
        title: strings.horizontalRule(),
        icon: Icons.horizontalRule,
        isChecked: horizontalRule,
        onClick: run("setHorizontalRule")
      },
      {
        key: "codeblock",
        type: "button",
        title: strings.codeBlock(),
        icon: Icons.codeblock,
        isChecked: codeBlock,
        onClick: run("toggleCodeBlock"),
        modifier: keybindings.toggleCodeBlock.keys
      },
      {
        key: "math",
        type: "button",
        title: strings.mathAndFormulas(),
        icon: Icons.mathBlock,
        isChecked: mathBlock,
        isHidden: !canMathBlock,
        onClick: run("insertMathBlock"),
        modifier: keybindings.insertMathBlock.keys
      },
      {
        key: "callout",
        type: "button",
        title: strings.callout(),
        icon: Icons.callout,
        menu: {
          title: strings.callout(),
          items: CALLOUTS.map((item) => ({
            key: item.key,
            type: "button" as const,
            title: item.title(),
            isChecked: calloutType === item.key,
            onClick: run("setCallout", { type: item.key })
          }))
        }
      },
      {
        key: "blockquote",
        type: "button",
        title: strings.quote(),
        icon: Icons.blockquote,
        isChecked: blockQuote,
        onClick: run("toggleBlockquote"),
        modifier: keybindings.insertBlockquote.keys
      },
      {
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
              isHidden: !picker,
              onClick: () => picker?.("image"),
              modifier: keybindings.addImage.keys
            },
            {
              key: "camera",
              type: "button",
              title: strings.takePhotoUsingCamera(),
              icon: Icons.camera,
              isHidden: !isMobile || !picker,
              onClick: () => picker?.("camera")
            },
            {
              key: "upload-from-url",
              type: "button",
              title: strings.attachImageFromURL(),
              icon: Icons.link,
              onClick: () =>
                showPopup({
                  popup: (hide) => (
                    <ImageUploadPopup
                      onInsert={(image) => {
                        editor.run({ name: "insertImage", args: [image] });
                        hide();
                      }}
                      onClose={hide}
                    />
                  )
                })
            }
          ]
        }
      },
      {
        key: "attachment",
        type: "button",
        title: strings.attachment(),
        icon: Icons.attachment,
        isChecked: attachment,
        isHidden: !picker,
        onClick: () => picker?.("file"),
        modifier: keybindings.addAttachment.keys
      },
      {
        key: "embed",
        type: "button",
        title: strings.embed(),
        icon: Icons.embed,
        onClick: () =>
          showPopup({
            popup: (hide) => (
              <EmbedPopup
                title={strings.insertEmbed()}
                onClose={(embed) => {
                  if (embed) editor.run({ name: "insertEmbed", args: [embed] });
                  hide();
                }}
              />
            )
          })
      },
      {
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
              component: (popupProps) => (
                <TablePopup
                  onInsertTable={(size) => {
                    editor.run({
                      name: "insertTable",
                      args: [{ rows: size.rows, cols: size.columns }]
                    });
                    popupProps.onClick?.();
                  }}
                />
              )
            }
          ]
        }
      }
    ];
  }, [
    editor,
    isMobile,
    picker,
    taskList,
    outlineList,
    horizontalRule,
    codeBlock,
    mathBlock,
    blockQuote,
    attachment,
    calloutType,
    canMathBlock
  ]);

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
