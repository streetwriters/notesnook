import { Box, Flex, Image, ImageProps, Text } from "rebass";
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from "../react";
import { Node } from "prosemirror-model";
import { Transaction, Selection } from "prosemirror-state";
import { findParentNodeClosestToPos, findChildren } from "@tiptap/core";
import { ThemeProvider } from "emotion-theming";
import { Theme } from "@notesnook/theme";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@rebass/forms";
import { TaskItemNode } from "../task-item";

export function TaskListComponent(props: NodeViewProps) {
  const { editor, getPos, node, updateAttributes } = props;
  const { collapsed, title } = node.attrs;
  const [stats, setStats] = useState({ checked: 0, total: 0, percentage: 0 });

  const theme = editor.storage.theme as Theme;

  const parentTaskItem = useMemo(() => {
    const resolvedPos = editor.state.doc.resolve(getPos());
    return findParentNodeClosestToPos(
      resolvedPos,
      (node) => node.type.name === TaskItemNode.name
    );
  }, []);

  const nested = !!parentTaskItem;

  useEffect(() => {
    if (!parentTaskItem) return;
    const { node, pos } = parentTaskItem;
    const allChecked = areAllChecked(node);
    const tr = editor.state.tr;
    tr.setNodeMarkup(pos, node.type, { checked: allChecked });
    editor.view.dispatch(tr);
  }, [parentTaskItem]);

  useEffect(() => {
    if (nested) return;
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
    <NodeViewWrapper style={{ display: collapsed ? "none" : "block" }}>
      <ThemeProvider theme={theme}>
        <Flex sx={{ flexDirection: "column" }}>
          {nested ? null : (
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
      </ThemeProvider>
      <NodeViewContent
        as={"ul"}
        style={{
          paddingInlineStart: 0,
          marginBlockStart: nested ? 10 : 0,
          marginBlockEnd: 0,
        }}
      />
    </NodeViewWrapper>
  );
}

function areAllChecked(node: Node) {
  const children = findChildren(
    node,
    (node) => node.type.name === TaskItemNode.name
  );
  return children.every((node) => node.node.attrs.checked);
}
