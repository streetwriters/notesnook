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
import { useEffect, useMemo, useState } from "react";
import { ToolButton } from "../../toolbar/components/tool-button";
import { ReactNodeViewProps } from "../react";
import { type TaskListAttributes } from "./task-list";
import { replaceDateTime } from "../date-time";
import { deleteCheckedItems, sortList } from "./utils";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export function TaskListComponent(
  props: ReactNodeViewProps<TaskListAttributes>
) {
  const { editor, getPos, node, updateAttributes, forwardRef, pos } = props;
  const { title, textDirection, readonly, stats } = node.attrs;
  const [selectAll, setSelectAll] = useState(false);

  const isNested = useMemo(() => {
    if (!pos) return false;
    return editor.state.doc.resolve(pos).parent.type.name === TaskItem.name;
  }, [editor.state.doc, pos]);

  useEffect(() => {
    let checked = true;

    node?.forEach((_node) => {
      if (!_node.attrs.checked) checked = false;
    });
    if (checked) setSelectAll(true);
    else setSelectAll(false);
  }, [node]);

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
          <Input
            readOnly={!editor.isEditable || readonly}
            value={title || ""}
            variant={"clean"}
            sx={{
              flex: 1,
              p: 0,
              px: 2,
              zIndex: 1,
              color: "var(--paragraph-secondary)",
              fontSize: "inherit",
              fontFamily: "inherit"
            }}
            placeholder="Untitled"
            onChange={(e) => {
              e.target.value = replaceDateTime(
                e.target.value,
                editor.current?.storage.dateFormat,
                editor.current?.storage.timeFormat
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
                title={`${selectAll ? "Uncheck" : "Check"} all taskitems`}
                icon={selectAll ? "selectAllChecked" : "selectAllUnchecked"}
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const parentPos = getPos();
                  editor.current?.commands.command(({ tr }) => {
                    const node = tr.doc.nodeAt(parentPos);
                    if (!node) return false;
                    node.forEach((_node, offset) => {
                      if (selectAll) {
                        tr.setNodeMarkup(parentPos + offset + 1, null, {
                          checked: false
                        });
                        setSelectAll(false);
                      } else {
                        tr.setNodeMarkup(parentPos + offset + 1, null, {
                          checked: true
                        });
                        setSelectAll(true);
                      }
                    });
                    return true;
                  });
                }}
              />
              <ToolButton
                toggled={false}
                title="Make tasklist readonly"
                icon={readonly ? "readonlyOn" : "readonlyOff"}
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const parentPos = getPos();
                  editor.current?.commands.command(({ tr }) => {
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
                title="Move all checked tasks to bottom"
                icon="sortTaskList"
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const pos = getPos();
                  editor.current
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
                title="Clear completed tasks"
                icon="clear"
                variant="small"
                sx={{
                  zIndex: 1
                }}
                onClick={() => {
                  const pos = getPos();

                  editor.current
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
              mr: 2,
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
