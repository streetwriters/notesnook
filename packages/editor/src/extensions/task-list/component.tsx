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
import { findChildren, getNodeType } from "@tiptap/core";
import TaskItem from "@tiptap/extension-task-item";
import { Node } from "prosemirror-model";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ToolButton } from "../../toolbar/components/tool-button";
import { findParentNodeOfTypeClosestToPos } from "../../utils/prosemirror";
import { ReactNodeViewProps } from "../react";
import { TaskItemNode } from "../task-item";
import { TaskListAttributes } from "./task-list";

export function TaskListComponent(
  props: ReactNodeViewProps<TaskListAttributes>
) {
  // const isMobile = useIsMobile();
  const { editor, getPos, node, updateAttributes, forwardRef } = props;
  const taskItemType = getNodeType(TaskItemNode.name, editor.schema);
  const { title, textDirection } = node.attrs;
  const [stats, setStats] = useState({ checked: 0, total: 0, percentage: 0 });

  const getParent = useCallback(() => {
    const pos = editor.state.doc.resolve(getPos());
    return findParentNodeOfTypeClosestToPos(pos, taskItemType);
  }, [editor.state.doc, getPos, taskItemType]);

  const isNested = useMemo(() => {
    return !!getParent();
  }, [getParent]);

  useEffect(() => {
    const parent = getParent();
    if (!parent) return;
    const { node, pos } = parent;
    const allChecked = areAllChecked(node, pos, editor.state.doc);

    // no need to create a transaction if the check state is
    // not changed.
    if (node.attrs.checked === allChecked) return;

    // check parent item if all child items are checked.
    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { checked: allChecked });
      return true;
    });
  }, [editor.commands, editor.state.doc, getParent, node, node.childCount]);

  useEffect(() => {
    let checked = 0;
    let total = 0;
    node.forEach((node) => {
      if (node.type.name === TaskItemNode.name) {
        if (node.attrs.checked) checked++;
        total++;
      }
    });
    const percentage = Math.round((checked / total) * 100);
    setStats({ checked, total, percentage });
  }, [isNested, node]);

  return (
    <>
      {!isNested && (
        <Flex
          sx={{
            position: "relative",
            bg: "bgSecondary",
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
              width: `${stats.percentage}%`,
              position: "absolute",
              bg: "border",

              zIndex: 0,
              left: 0,
              transition: "width 250ms ease-out"
            }}
          />
          <Input
            readOnly={!editor.isEditable}
            value={title || ""}
            variant={"clean"}
            sx={{
              p: 0,
              px: 2,
              zIndex: 1,
              color: "fontTertiary",
              fontSize: "title"
            }}
            placeholder="Untitled"
            onChange={(e) => {
              updateAttributes(
                { title: e.target.value },
                { addToHistory: true, preventUpdate: false }
              );
            }}
          />
          {editor.isEditable && (
            <ToolButton
              toggled={false}
              title="Clear completed tasks"
              icon="clear"
              variant="small"
              sx={{
                zIndex: 1
              }}
              onClick={() => {
                if (!editor.isEditable) return;
                if (!editor.current) return;
                const pos = getPos();
                // we need to get a fresh instance of the task list instead
                // of using the one we got via props.
                const node = editor.current.state.doc.nodeAt(pos);
                if (!node) return;

                editor.current?.commands.command(({ tr }) => {
                  const taskItems = findChildren(
                    node,
                    (n) => n.type.name === TaskItem.name && n.attrs.checked
                  );
                  const mapping = tr.mapping;
                  for (const item of taskItems) {
                    const childPos = pos + item.pos + 1;
                    tr.deleteRange(
                      mapping.map(childPos),
                      mapping.map(childPos + item.node.nodeSize)
                    );
                  }
                  return true;
                });
              }}
            />
          )}
          <Text
            variant={"body"}
            sx={{
              ml: 1,
              mr: 2,
              color: "fontTertiary",
              flexShrink: 0,
              zIndex: 1
            }}
          >
            {stats.checked}/{stats.total}
          </Text>
        </Flex>
      )}
      <Text
        as={"div"}
        ref={forwardRef}
        dir={textDirection}
        sx={{
          ul: {
            display: "block",
            paddingInlineStart: 0,
            marginBlockStart: isNested ? 10 : 0,
            marginBlockEnd: 0,
            marginLeft: isNested ? (editor.isEditable ? -35 : -10) : 0
          },
          li: {
            listStyleType: "none",
            position: "relative",
            marginBottom: isNested ? 1 : [2, 1],

            display: "flex",
            bg: "background",
            borderRadius: "default",
            gap: 2,
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

function areAllChecked(node: Node, pos: number, doc: Node) {
  const children = findChildren(
    node,
    (node) => node.type.name === TaskItemNode.name
  );

  for (const child of children) {
    const childPos = pos + child.pos + 1;
    const node = doc.nodeAt(childPos);
    if (!node?.attrs.checked) return false;
  }

  return true;
}
