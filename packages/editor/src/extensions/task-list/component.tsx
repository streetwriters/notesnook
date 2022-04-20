import { Box, Flex, Image, ImageProps, Text } from "rebass";
import {
  NodeViewWrapper,
  NodeViewProps,
  NodeViewContent,
  FloatingMenu,
} from "@tiptap/react";
import { Node } from "prosemirror-model";
import { Transaction, Selection } from "prosemirror-state";
import { findParentNodeClosestToPos, findChildren } from "@tiptap/core";
import { ThemeProvider } from "emotion-theming";
import { Theme } from "@notesnook/theme";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useEffect, useState } from "react";

export function TaskListComponent(props: NodeViewProps) {
  const { editor, getPos, node } = props;
  const { collapsed } = node.attrs;
  const [stats, setStats] = useState({ checked: 0, total: 0, percentage: 0 });

  const theme = editor.storage.theme as Theme;
  const resolvedPos = editor.state.doc.resolve(getPos());
  const parentTaskItem = findParentNodeClosestToPos(
    resolvedPos,
    (node) => node.type.name === "taskItem"
  );
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
      (node) => node.type.name === "taskItem"
    );
    const checked = children.filter((node) => node.node.attrs.checked).length;
    const total = children.length;
    const percentage = Math.round((checked / total) * 100);
    setStats({ checked, total, percentage });
  }, [nested, node]);
  console.log(collapsed);
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
                px: 2,
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
              <Flex sx={{ zIndex: 1 }}>
                <Icon path={Icons.checkbox} size={15} />
                <Text variant={"body"} sx={{ ml: 1 }}>
                  {stats.checked}/{stats.total}
                </Text>
              </Flex>
              {/* <Text variant={"body"} sx={{ zIndex: 1 }}>
                {stats.percentage}% done
              </Text> */}
            </Flex>
          )}
          <NodeViewContent
            as={"ul"}
            style={{
              paddingInlineStart: 0,
              marginBlockStart: nested ? 15 : 0,
              marginBlockEnd: 0,
            }}
          />
        </Flex>
      </ThemeProvider>
    </NodeViewWrapper>
  );
}

function areAllChecked(node: Node) {
  const children = findChildren(node, (node) => node.type.name === "taskItem");
  return children.every((node) => node.node.attrs.checked);
}
