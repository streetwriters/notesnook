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
import { useCallback, useState } from "react";

export function TaskItemComponent(props: ImageProps & NodeViewProps) {
  const { checked } = props.node.attrs;

  const { editor, updateAttributes, node, getPos } = props;
  // const [isOpen, setIsOpen] = useState(true);
  // const elementRef = useRef<HTMLSpanElement>();
  // const isActive = editor.isActive("attachment", { hash });
  // const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>();
  const theme = editor.storage.theme as Theme;

  //   useEffect(() => {
  //     setIsToolbarVisible(isActive);
  //   }, [isActive]);

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
          <Flex sx={{ flex: 1 }}>
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
                  fill: "var(--disabled) !important",
                },
              }}
              size={20}
            />
            <Icon
              path={checked ? Icons.check : ""}
              sx={{
                border: "2px solid",
                borderColor: checked ? "disabled" : "icon",
                borderRadius: "default",
                alignSelf: "start",
                mr: 2,
                p: "1px",
                cursor: "pointer",
                ":hover": {
                  borderColor: "disabled",
                },
                ":hover .icon path": {
                  fill: "var(--disabled) !important",
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
              color={checked ? "disabled" : "icon"}
              size={13}
            />

            <NodeViewContent
              as={"li"}
              style={{
                listStyleType: "none",
                textDecorationLine: checked ? "line-through" : "none",
                color: checked ? "var(--disabled)" : "var(--text)",
                flex: 1,
              }}
            />
          </Flex>
          {isNested && (
            <Icon
              className="toggleSublist"
              path={
                nestedTaskList.node.attrs.collapsed
                  ? Icons.chevronDown
                  : Icons.chevronUp
              }
              sx={{
                opacity: 0,
                position: "absolute",
                right: 0,
                alignSelf: "start",
                mr: 2,
                cursor: "pointer",
                ".icon:hover path": {
                  fill: "var(--disabled) !important",
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
          )}
        </Flex>
      </ThemeProvider>
      {/*
        <Flex>
          <Box></Box>
          
          <Box contentEditable="true" />
        </Flex>
      </ThemeProvider> */}
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
