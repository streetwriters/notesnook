import { Box, Flex, Text } from "rebass";
import { ReactNodeViewProps } from "../react";
import { Node } from "prosemirror-model";
import {
  findParentNodeClosestToPos,
  findChildren,
  getNodeType,
} from "@tiptap/core";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@rebass/forms";
import { TaskItemNode } from "../task-item";
import { TaskListAttributes } from "./task-list";
import { findParentNodeOfTypeClosestToPos } from "prosemirror-utils";

export function TaskListComponent(
  props: ReactNodeViewProps<TaskListAttributes>
) {
  const { editor, getPos, node, updateAttributes, forwardRef } = props;
  const taskItemType = getNodeType(TaskItemNode.name, editor.schema);
  const { title, collapsed } = node.attrs;
  const [stats, setStats] = useState({ checked: 0, total: 0, percentage: 0 });

  const parentTaskItem = useMemo(() => {
    const pos = editor.state.doc.resolve(getPos());
    return findParentNodeOfTypeClosestToPos(pos, taskItemType);
  }, []);

  const nested = !!parentTaskItem;

  useEffect(() => {
    if (!parentTaskItem) return;
    const { node, pos } = parentTaskItem;
    const allChecked = areAllChecked(node, pos, editor.state.doc);

    // check parent item if all child items are checked.
    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { checked: allChecked });
      return true;
    });
  }, [node, parentTaskItem]);

  useEffect(() => {
    const children = findChildren(
      node,
      (node) => node.type.name === TaskItemNode.name
    );
    const checked = children.filter((node) => node.node.attrs.checked).length;
    const total = children.length;
    const percentage = Math.round((checked / total) * 100);
    setStats({ checked, total, percentage });
  }, [nested, node]);

  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          ":hover > div > .toggleSublist": { opacity: 1 },
        }}
      >
        {nested ? (
          <Flex
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
            }}
            contentEditable={false}
          >
            {collapsed && (
              <Text variant={"body"} sx={{ color: "fontTertiary", mr: 35 }}>
                {stats.checked}/{stats.total}
              </Text>
            )}
            <Icon
              className="toggleSublist"
              path={collapsed ? Icons.chevronDown : Icons.chevronUp}
              sx={{
                opacity: collapsed ? 1 : 0,
                position: "absolute",
                right: 0,
                alignSelf: "start",
                mr: 2,
                cursor: "pointer",
                ".icon:hover path": {
                  fill: "var(--checked) !important",
                },
              }}
              size={20}
              onClick={() => {
                updateAttributes({ collapsed: !collapsed });
              }}
            />
          </Flex>
        ) : (
          <Flex
            sx={{
              position: "relative",
              bg: "bgSecondary",
              py: 1,
              borderRadius: "default",
              mb: 2,
              alignItems: "center",
              justifyContent: "end",
              overflow: "hidden",
            }}
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
                transition: "width 250ms ease-out",
              }}
            />
            <Input
              value={title || ""}
              variant={"clean"}
              sx={{ p: 0, px: 2, zIndex: 1, color: "fontTertiary" }}
              placeholder="Untitled"
              onChange={(e) => {
                updateAttributes({ title: e.target.value });
              }}
            />
            <Flex sx={{ flexShrink: 0, pr: 2 }}>
              <Icon path={Icons.checkbox} size={15} color="fontTertiary" />
              <Text variant={"body"} sx={{ ml: 1, color: "fontTertiary" }}>
                {stats.checked}/{stats.total}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>
      <Text
        as={"div"}
        ref={forwardRef}
        sx={{
          ul: {
            display: collapsed ? "none" : "block",
            paddingInlineStart: 0,
            marginBlockStart: nested ? 10 : 0,
            marginBlockEnd: 0,
          },
          li: {
            listStyleType: "none",
            position: "relative",
          },
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
