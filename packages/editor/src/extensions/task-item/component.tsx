import { Flex, Text } from "rebass";
import { ReactNodeViewProps } from "../react";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { Node } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import { findChildren, findChildrenInRange, NodeWithPos } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { TaskItemNode, TaskItemAttributes } from "./task-item";
import {
  useIsKeyboardOpen,
  useIsMobile,
} from "../../toolbar/stores/toolbar-store";

export function TaskItemComponent(
  props: ReactNodeViewProps<TaskItemAttributes>
) {
  const { editor, updateAttributes, node, getPos, forwardRef } = props;
  const { checked } = props.node.attrs;
  const isMobile = useIsMobile();
  const isKeyboardOpen = useIsKeyboardOpen();

  const toggle = useCallback(() => {
    if (!editor.isEditable || !editor.current) return false;

    const { empty, from, to } = editor.current.state.selection;
    if (!empty) {
      const selectedTaskItems = findChildrenInRange(
        editor.current.state.doc,
        { from, to },
        (node) => node.type.name === TaskItemNode.name
      );
      editor.current.commands.command(({ tr }) => {
        for (const { pos } of selectedTaskItems) {
          tr.setNodeMarkup(pos, null, { checked: !checked });
        }
        return true;
      });
    } else {
      updateAttributes({ checked: !checked });

      const pos = getPos();
      const node = editor.current?.state.doc.nodeAt(pos);
      if (!node) return false;

      editor.commands.command(({ tr }) => {
        toggleChildren(node, tr, !checked, pos);
        return true;
      });
    }

    return true;
  }, [editor, getPos, checked]);

  return (
    <>
      <Flex
        data-drag-image
        sx={{
          bg: "background",
          borderRadius: "default",
          ":hover > .dragHandle": {
            opacity: editor.isEditable ? 1 : 0,
          },
        }}
        contentEditable={false}
      >
        <Icon
          className="dragHandle"
          draggable="true"
          // NOTE: Turning this off somehow makes drag/drop stop working
          // properly on touch devices.
          // contentEditable={false}
          data-drag-handle
          path={Icons.dragHandle}
          sx={{
            opacity: [1, 1, 0],
            alignSelf: "start",
            mr: 2,
            bg: "transparent",
            cursor: "grab",
            ".icon:hover path": {
              fill: "var(--checked) !important",
            },
          }}
          size={isMobile ? 24 : 20}
        />
        <Icon
          path={checked ? Icons.check : ""}
          stroke="1px"
          contentEditable={false}
          sx={{
            border: "2px solid",
            borderColor: checked ? "checked" : "icon",
            borderRadius: "default",
            alignSelf: "start",
            mr: 2,
            p: "1px",
            cursor: editor.isEditable ? "pointer" : "unset",
            ":hover": {
              borderColor: "checked",
            },
            ":hover .icon path": {
              fill: "var(--checked) !important",
            },
          }}
          onMouseDown={(e) => {
            if (isKeyboardOpen) {
              e.preventDefault();
            }
            toggle();
          }}
          onTouchEnd={(e) => {
            if (isKeyboardOpen) {
              e.preventDefault();
              toggle();
            }
          }}
          color={checked ? "checked" : "icon"}
          size={isMobile ? 16 : 14}
        />

        <Text
          as="div"
          ref={forwardRef}
          sx={{
            "> .taskitem-content-wrapper > p": {
              textDecorationLine: checked ? "line-through" : "none",
              opacity: checked ? 0.8 : 1,
            },
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
