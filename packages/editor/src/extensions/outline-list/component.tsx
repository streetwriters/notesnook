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
import { OutlineListAttributes } from "./outline-list";
import { findParentNodeOfTypeClosestToPos } from "prosemirror-utils";
import { OutlineListItem } from "../outline-list-item";

export function OutlineListComponent(
  props: ReactNodeViewProps<OutlineListAttributes>
) {
  const { editor, getPos, node, updateAttributes, forwardRef } = props;
  const { collapsed } = node.attrs;

  const isNested = useMemo(() => {
    const pos = editor.state.doc.resolve(getPos());
    return pos.parent?.type.name === OutlineListItem.name;
  }, []);

  return (
    <>
      <Text
        className="outline-list"
        as={"div"}
        ref={forwardRef}
        sx={{
          ul: {
            display: collapsed ? "none" : "block",
            paddingInlineStart: 0,
            paddingLeft: isNested ? 1 : 0,
            marginBlockStart: isNested ? 5 : 0,
            marginBlockEnd: 0,
          },
        }}
      />
    </>
  );
}
