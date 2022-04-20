import { Box, Flex, Image, ImageProps, Text } from "rebass";
import {
  NodeViewWrapper,
  NodeViewProps,
  NodeViewContent,
  FloatingMenu,
} from "@tiptap/react";
import { ThemeProvider } from "emotion-theming";
import { Theme } from "@notesnook/theme";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { Node } from "prosemirror-model";
import { Transaction, Selection } from "prosemirror-state";
import {
  findParentNodeClosestToPos,
  findChildren,
  NodeWithPos,
} from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

export function TaskItemComponent(props: ImageProps & NodeViewProps) {
  const { checked } = props.node.attrs;
  const [stats, setStats] = useState({ checked: 0, total: 0 });
  const { editor, updateAttributes, node, getPos } = props;
  const theme = editor.storage.theme as Theme;

  const toggle = useCallback(() => {
    if (!editor.isEditable) return false;
    updateAttributes({ checked: !checked });

    const tr = editor.state.tr;
    const parentPos = getPos();

    toggleChildren(node, tr, !checked, parentPos);

    editor.view.dispatch(tr);
    return true;
  }, [editor, getPos, node]);

  const nestedTaskList = getChildren(node, getPos()).find(
    ({ node }) => node.type.name === "taskList"
  );
  const isNested = !!nestedTaskList;
  const isCollapsed = nestedTaskList
    ? nestedTaskList.node.attrs.collapsed
    : false;

  useEffect(() => {
    if (!nestedTaskList) return;
    const { pos, node } = nestedTaskList;
    const children = findChildren(
      node,
      (node) => node.type.name === "taskItem"
    );
    const checked = children.filter(({ node }) => node.attrs.checked).length;
    const total = children.length;
    setStats({ checked, total });
  }, [isNested, nestedTaskList, node]);

  return (
    <NodeViewWrapper>
      <ThemeProvider theme={theme}>
        <Flex
          sx={{
            mb: 2,
            ":hover > .dragHandle, :hover > .toggleSublist": {
              opacity: 1,
            },
          }}
        >
          <Icon
            className="dragHandle"
            draggable="true"
            contentEditable={false}
            data-drag-handle
            path={Icons.dragHandle}
            sx={{
              opacity: 0,
              alignSelf: "start",
              mr: 2,
              cursor: "grab",
              ".icon:hover path": {
                fill: "var(--checked) !important",
              },
            }}
            size={20}
          />
          <Icon
            path={checked ? Icons.check : ""}
            stroke="1px"
            sx={{
              border: "2px solid",
              borderColor: checked ? "checked" : "icon",
              borderRadius: "default",
              alignSelf: "start",
              mr: 2,
              p: "1px",
              cursor: "pointer",
              ":hover": {
                borderColor: "checked",
              },
              ":hover .icon path": {
                fill: "var(--checked) !important",
              },
            }}
            onMouseEnter={(e) => {
              if (e.buttons > 0) {
                toggle();
              }
            }}
            onMouseDown={(e) => {
              if (toggle()) e.preventDefault();
            }}
            color={checked ? "checked" : "icon"}
            size={13}
          />

          <NodeViewContent
            as={"li"}
            style={{
              listStyleType: "none",
              textDecorationLine: checked ? "line-through" : "none",
              color: checked ? "var(--checked)" : "var(--text)",
              flex: 1,
            }}
          />

          {isNested && (
            <>
              {isCollapsed && (
                <Text variant={"body"} sx={{ color: "fontTertiary", mr: 35 }}>
                  {stats.checked}/{stats.total}
                </Text>
              )}
              <Icon
                className="toggleSublist"
                path={
                  nestedTaskList.node.attrs.collapsed
                    ? Icons.chevronDown
                    : Icons.chevronUp
                }
                sx={{
                  opacity: isCollapsed ? 1 : 0,
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
                  editor
                    .chain()
                    .setNodeSelection(getPos())
                    .command(({ tr }) => {
                      const { pos, node } = nestedTaskList;
                      tr.setNodeMarkup(pos, undefined, {
                        collapsed: !node.attrs.collapsed,
                      });
                      return true;
                    })
                    .run();
                }}
              />
            </>
          )}
        </Flex>
      </ThemeProvider>
    </NodeViewWrapper>
  );
}

function toggleChildren(
  node: Node,
  tr: Transaction<any>,
  toggleState: boolean,
  parentPos: number
): Transaction<any> {
  const children = findChildren(node, (node) => node.type.name === "taskItem");
  for (const { pos } of children) {
    // need to add 1 to get inside the node
    const actualPos = pos + parentPos + 1;
    tr.setNodeMarkup(actualPos, undefined, {
      checked: toggleState,
    });
  }
  return tr;
}

function getChildren(node: Node, parentPos: number) {
  const children: NodeWithPos[] = [];
  node.forEach((node, offset) => {
    children.push({ node, pos: parentPos + offset + 1 });
  });
  return children;
}
