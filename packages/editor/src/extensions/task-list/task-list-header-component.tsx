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

import { Box, Flex, Text } from "@theme-ui/components";
import { ToolButton } from "../../toolbar/components/tool-button";
import { ReactNodeViewProps } from "../react";
import { deleteCheckedItems, findRootTaskList, sortList } from "./utils";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
import { Icons } from "../../toolbar/icons";
import { Icon } from "@notesnook/ui";
import type { TaskListHeaderAttributes } from "./task-list-header";
import { toggleChildren } from "./task-list-items";

export function TaskListHeaderComponent(
  props: ReactNodeViewProps<TaskListHeaderAttributes>
) {
  const { editor, getPos, node, forwardRef } = props;
  const { textDirection, stats } = node.attrs;
  const isMobile = useIsMobile();
  const checked = stats.total > 0 && stats.total === stats.checked;

  return (
    <>
      <Flex
        sx={{
          position: "relative",
          bg: "var(--background-secondary)",
          py: 1,
          borderRadius: "default",
          mb: 1,
          alignItems: "center",
          overflow: "hidden"
        }}
        className="task-list-tools"
        dir={textDirection}
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
                const root = findRootTaskList(tr.doc, parentPos);
                if (!root) return false;
                toggleChildren(tr, root.node, !checked, root.pos);
                return true;
              });
            }}
            color={checked ? "accent" : "icon"}
            size={isMobile ? "1.70ch" : "1.46ch"}
          />
        ) : null}
        <Text
          as="div"
          ref={forwardRef}
          sx={{
            flex: 1,
            paddingInlineStart: 1,
            zIndex: 1,
            p: { m: 0 }
          }}
        />
        {editor.isEditable && (
          <>
            <ToolButton
              toggled={false}
              title="Make tasklist readonly"
              icon={"readonlyOff"}
              variant="small"
              sx={{
                zIndex: 1
              }}
              onClick={() => {
                const parentPos = getPos();
                editor.commands.command(({ tr }) => {
                  const root = findRootTaskList(tr.doc, parentPos);
                  if (!root) return false;
                  const toggleState = !root.node.attrs.editable;
                  tr.setNodeMarkup(root.pos, null, {
                    ...node.attrs,
                    editable: toggleState
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
              title="Clear completed tasks"
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
    </>
  );
}
