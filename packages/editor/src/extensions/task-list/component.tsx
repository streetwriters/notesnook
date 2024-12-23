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

import { Box, Flex, Input, Text } from "@theme-ui/components";
import { useMemo } from "react";
import { ToolButton } from "../../toolbar/components/tool-button.js";
import { ReactNodeViewProps } from "../react/index.js";
import { type TaskListAttributes } from "./task-list.js";
import { replaceDateTime } from "../date-time/index.js";
import { deleteCheckedItems, sortList, toggleChildren } from "./utils.js";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useIsMobile } from "../../toolbar/stores/toolbar-store.js";
import { Icons } from "../../toolbar/icons.js";
import { Icon } from "@notesnook/ui";
import { strings } from "@notesnook/intl";

export function TaskListComponent(
  props: ReactNodeViewProps<TaskListAttributes>
) {
  const { editor, getPos, node, updateAttributes, forwardRef, pos } = props;
  const { title, textDirection, readonly, stats } = node.attrs;
  const isMobile = useIsMobile();
  const checked = stats.total > 0 && stats.total === stats.checked;

  const isNested = useMemo(() => {
    if (!pos || !(pos >= 0 && pos <= editor.state.doc.content.size))
      return false;

    return editor.state.doc.resolve(pos).parent.type.name === TaskItem.name;
  }, [editor.state.doc, pos]);

  return (
    <>
      {isNested ? null : (
        <Flex
          sx={{
            position: "relative",
            bg: "var(--background-secondary)",
            py: 1,
            borderRadius: "default",
            mb: 2,
            alignItems: "center",
            justifyContent: "end",
            overflow: "hidden"
          }}
          className="task-list-tools"
          dir={textDirection}
          contentEditable={false}
        >
          <Box
            sx={{
              height: "100%",
              width: `${Math.round((stats.checked / stats.total) * 100)}%`,
              position: "absolute",
              bg: "shade",

              zIndex: 0,
              left: 0,
              transition: "width 250ms ease-out"
            }}
          />
          {editor.isEditable ? (
            <Icon
              path={checked ? Icons.check : ""}
              stroke="1px"
              contentEditable={false}
              tabIndex={1}
              sx={{
                border: "2px solid",
                borderColor: checked ? "accent" : "icon",
                borderRadius: "default",
                p: "1px",
                zIndex: 1,
                // mt: isMobile ? "0.20ch" : "0.36ch",
                marginInlineStart: 1,
                cursor: editor.isEditable ? "pointer" : "unset",
                ":hover": isMobile
                  ? undefined
                  : {
                      borderColor: "accent"
                    },
                fontFamily: "inherit"
              }}
              onClick={() => {
                const parentPos = getPos();
                editor.commands.command(({ tr }) => {
                  const node = tr.doc.nodeAt(parentPos);
                  if (!node) return false;
                  toggleChildren(tr, node, !checked, parentPos);
                  return true;
                });
              }}
              color={checked ? "accent" : "icon"}
              size={isMobile ? "1.70ch" : "1.46ch"}
            />
          ) : null}
          <Input
            readOnly={!editor.isEditable || readonly}
            value={title || ""}
            variant={"clean"}
            sx={{
              flex: 1,
              p: 0,
              px: 1,
              zIndex: 1,
              color: "var(--paragraph-secondary)",
              fontSize: "inherit",
              fontFamily: "inherit"
            }}
            placeholder={strings.untitled()}
            onChange={(e) => {
              e.target.value = replaceDateTime(
                e.target.value,
                editor.storage.dateFormat,
                editor.storage.timeFormat
              );
              updateAttributes(
                { title: e.target.value },
                { addToHistory: true, preventUpdate: false }
              );
            }}
          />
          {editor.isEditable && (
            <>
              <ToolButton
                toggled={false}
                title={strings.readonlyTaskList()}
                icon={readonly ? "readonlyOn" : "readonlyOff"}
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const parentPos = getPos();
                  editor.commands.command(({ tr }) => {
                    const node = tr.doc.nodeAt(parentPos);
                    if (!node) return false;
                    const toggleState = !node.attrs.readonly;
                    tr.setNodeMarkup(tr.mapping.map(parentPos), null, {
                      ...node.attrs,
                      readonly: toggleState
                    });
                    node.descendants((node, pos) => {
                      if (node.type.name === TaskList.name) {
                        const actualPos = pos + parentPos + 1;
                        tr.setNodeMarkup(tr.mapping.map(actualPos), null, {
                          ...node.attrs,
                          readonly: toggleState
                        });
                      }
                    });
                    return true;
                  });
                }}
              />
              <ToolButton
                toggled={false}
                title={strings.sortTaskList()}
                icon="sortTaskList"
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const pos = getPos();
                  editor
                    ?.chain()
                    .focus()
                    .command(({ tr }) => {
                      return !!sortList(tr, pos);
                    })
                    .run();
                }}
              />
              <ToolButton
                toggled={false}
                title={strings.clearCompletedTasks()}
                icon="clear"
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const pos = getPos();

                  editor
                    ?.chain()
                    .focus()
                    .command(({ tr }) => {
                      return !!deleteCheckedItems(tr, pos);
                    })
                    .run();
                }}
              />
            </>
          )}
          <Text
            variant={"body"}
            sx={{
              ml: 1,
              mr: 1,
              color: "var(--paragraph-secondary)",
              flexShrink: 0,
              zIndex: 1,
              fontFamily: "inherit"
            }}
          >
            {stats.checked}/{stats.total}
          </Text>
        </Flex>
      )}
      <Box
        ref={forwardRef}
        dir={textDirection}
        contentEditable={editor.isEditable && !readonly}
        onPaste={(e) => {
          if (readonly) e.preventDefault();
        }}
        sx={{
          ul: {
            display: "block",
            paddingInlineStart: 0,
            marginBlockStart: isNested ? 10 : 0,
            marginBlockEnd: 0,
            marginLeft: isNested ? (editor.isEditable ? -35 : -10) : 0,
            padding: 0
          },
          li: {
            listStyleType: "none",
            position: "relative",
            marginTop: 2,
            marginBottom: 0,

            display: "flex",
            bg: "background",
            borderRadius: "default",
            ":hover > .dragHandle": {
              opacity: editor.isEditable ? 1 : 0
            },
            ":hover > .taskItemTools": {
              opacity: 1
            }
          }
        }}
      />
    </>
  );
}
