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

import { Box, Flex } from "@theme-ui/components";
import { ReactNodeViewProps } from "../react/index.js";
import { Icon } from "@notesnook/ui";
import { Icons } from "../../toolbar/icons.js";
import { findChildrenInRange } from "@tiptap/core";
import { useCallback } from "react";
import type { TaskItemAttributes } from "./task-item.js";
import { useIsMobile } from "../../toolbar/stores/toolbar-store.js";
import { isiOS } from "../../utils/platform.js";
import { DesktopOnly } from "../../components/responsive/index.js";
import TaskItem from "@tiptap/extension-task-item";
import { strings } from "@notesnook/intl";

export function TaskItemComponent(
  props: ReactNodeViewProps<TaskItemAttributes>
) {
  const { editor, updateAttributes, getPos, forwardRef, node } = props;
  const { checked } = props.node.attrs;
  const isMobile = useIsMobile();

  const toggle = useCallback(() => {
    if (!editor.isEditable || !editor) return false;

    const { empty, from, to } = editor.state.selection;
    const selectedTaskItems = findChildrenInRange(
      editor.state.doc,
      { from, to },
      (node) => node.type.name === TaskItem.name
    );
    if (!empty && selectedTaskItems.findIndex((a) => a.node === node) > -1) {
      editor.commands.command(({ tr }) => {
        for (const { pos } of selectedTaskItems) {
          tr.setNodeMarkup(pos, null, { checked: !checked });
        }
        return true;
      });
    } else {
      updateAttributes({ checked: !checked });
    }

    return true;
  }, [editor, checked, updateAttributes, node]);

  return (
    <>
      {editor.isEditable && (
        <Icon
          className="dragHandle"
          draggable="true"
          // NOTE: Turning this off somehow makes drag/drop stop working
          // properly on touch devices.
          // contentEditable={false}
          data-drag-handle
          path={Icons.dragHandle}
          sx={{
            opacity: [1, 1, 0],
            alignSelf: "start",
            bg: "transparent",
            mt: isMobile ? "0.20ch" : "0.36ch",
            cursor: "grab",
            mx: 1,
            fontFamily: "inherit"
          }}
          size={isMobile ? "2.46ch" : "2.22ch"}
        />
      )}
      <Icon
        path={checked ? Icons.check : ""}
        stroke="1px"
        contentEditable={false}
        tabIndex={1}
        sx={{
          border: "2px solid",
          borderColor: checked ? "accent" : "icon",
          borderRadius: "default",
          alignSelf: "start",
          p: "1px",
          mt: isMobile ? "0.20ch" : "0.36ch",
          marginInlineEnd: 1,
          cursor: editor.isEditable ? "pointer" : "unset",
          ":hover": isMobile
            ? undefined
            : {
                borderColor: "accent"
              },
          fontFamily: "inherit"
        }}
        onMouseDown={(e) => {
          if (globalThis.keyboardShown) {
            e.preventDefault();
          }
          toggle();
        }}
        onTouchEnd={(e) => {
          if (globalThis["keyboardShown"] || isiOS) {
            e.preventDefault();
            toggle();
          }
        }}
        color={checked ? "accent" : "icon"}
        size={isMobile ? "1.70ch" : "1.46ch"}
      />

      <Box
        ref={forwardRef}
        sx={{
          "> .taskitem-content-wrapper > p": {
            textDecorationLine: checked ? "line-through" : "none",
            opacity: checked ? 0.8 : 1
          },
          flex: 1,
          mt: ["3px", "3px", 0],
          ml: ["2px", "2px", 0]
        }}
      />
      <DesktopOnly>
        <Flex
          className="taskItemTools"
          sx={{
            bg: "background",
            opacity: 0,
            position: "absolute",
            top: 1,
            right: 0,
            alignItems: "center"
          }}
        >
          {editor.isEditable && (
            <Icon
              className="deleleTaskItem"
              title={strings.delete()}
              path={Icons.close}
              size={18}
              sx={{
                cursor: "pointer"
              }}
              onClick={() => {
                if (!editor) return;
                const pos = getPos();

                // we need to get a fresh instance of the task list instead
                // of using the one we got via props.
                const node = editor.state.doc.nodeAt(pos);
                if (!node) return;

                editor.commands.command(({ tr }) => {
                  tr.deleteRange(pos, pos + node.nodeSize);
                  return true;
                });
              }}
            />
          )}
        </Flex>
      </DesktopOnly>
    </>
  );
}
