import { Flex, Text } from "rebass";
import { ReactNodeViewProps } from "../react";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import {
  findChildren,
  findParentNode,
  getNodeType,
  NodeWithPos,
} from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { TaskItemNode, TaskItemAttributes } from "./task-item";

export function TaskItemComponent(
  props: ReactNodeViewProps<TaskItemAttributes>
) {
  const { editor, updateAttributes, node, getPos, forwardRef } = props;
  const { checked } = props.node.attrs;

  const toggle = useCallback(() => {
    if (!editor.isEditable) return false;
    updateAttributes({ checked: !checked });
    editor.commands.command(({ tr }) => {
      const parentPos = getPos();
      toggleChildren(node, tr, !checked, parentPos);
      return true;
    });
    return true;
  }, [editor, getPos, node, checked]);

  return (
    <>
      <Flex
        sx={{
          ":hover > .dragHandle": {
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
          onMouseDown={(e) => {
            if (toggle()) e.preventDefault();
          }}
          color={checked ? "checked" : "icon"}
          size={13}
        />

        <Text
          as="div"
          ref={forwardRef}
          sx={{
            textDecorationLine: checked ? "line-through" : "none",
            color: checked ? "var(--checked)" : "var(--text)",
            flex: 1,
          }}
        />
      </Flex>
    </>
  );
}

function toggleChildren(
  node: Node,
  tr: Transaction,
  toggleState: boolean,
  parentPos: number
): Transaction {
  const children = findChildren(
    node,
    (node) => node.type.name === TaskItemNode.name
  );
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

function areAllChecked(node: Node) {
  const children = findChildren(
    node,
    (node) => node.type.name === TaskItemNode.name
  );
  if (children.length <= 0) return undefined;
  return children.every((node) => node.node.attrs.checked);
}
