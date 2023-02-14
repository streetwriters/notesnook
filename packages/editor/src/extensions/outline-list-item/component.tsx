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
import { GetPosNode, ReactNodeViewProps } from "../react";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { findChildren } from "@tiptap/core";
import { OutlineList } from "../outline-list/outline-list";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
import { Editor } from "../../types";
import { TextDirections } from "../text-direction";

export function OutlineListItemComponent(props: ReactNodeViewProps) {
  const { editor, node, getPos, forwardRef } = props;

  const isMobile = useIsMobile();
  const isNested = node.lastChild?.type.name === OutlineList.name;
  const isCollapsed = isNested && node.lastChild?.attrs.collapsed;

  return (
    <Flex>
      <Flex
        className="outline"
        sx={{
          flexDirection: "column",
          alignItems: "center",
          mt: isMobile ? "0px" : "3px"
        }}
      >
        {isNested ? (
          <>
            <ToggleIconButton
              editor={editor}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              node={node}
              getPos={getPos}
              textDirection={undefined}
            />
            <ToggleIconButton
              editor={editor}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              node={node}
              getPos={getPos}
              textDirection={"rtl"}
            />
          </>
        ) : (
          <Icon
            path={Icons.circle}
            size={isMobile ? 24 : 18}
            sx={{ transform: "scale(0.4)" }}
          />
        )}

        {isNested && !isCollapsed && (
          <Box
            sx={{
              flex: 1,
              width: 1,
              mt: 2,
              backgroundColor: "border",
              borderRadius: 50,
              flexShrink: 0,
              cursor: "pointer",
              transition: "all .2s ease-in-out",
              ":hover": {
                backgroundColor: "fontTertiary",
                width: 4
              }
            }}
            contentEditable={false}
          />
        )}
      </Flex>
      <Text
        ref={forwardRef}
        sx={{
          pl: 1,
          listStyleType: "none",
          flex: 1
        }}
      />
    </Flex>
  );
}

function toggleOutlineList(
  editor: Editor,
  node: ProsemirrorNode,
  isCollapsed: boolean,
  nodePos: number
) {
  const [subList] = findChildren(
    node,
    (node) => node.type.name === OutlineList.name
  );
  if (!subList) return;
  const { pos } = subList;

  editor.current?.commands.toggleOutlineCollapse(
    pos + nodePos + 1,
    !isCollapsed
  );
}

type ToggleIconButtonProps = {
  textDirection: TextDirections;
  isCollapsed: boolean;
  isMobile: boolean;

  editor: Editor;
  node: ProsemirrorNode;
  getPos: GetPosNode;
};
function ToggleIconButton(props: ToggleIconButtonProps) {
  const { textDirection, isCollapsed, isMobile, editor, node, getPos } = props;

  return (
    <Icon
      className={`outline-list-item-toggle ${textDirection || ""}`}
      path={
        isCollapsed
          ? textDirection === "rtl"
            ? Icons.chevronLeft
            : Icons.chevronRight
          : Icons.chevronDown
      }
      title={
        isCollapsed ? "Click to uncollapse list" : "Click to collapse list"
      }
      sx={{
        cursor: "pointer",
        transition: "all .2s ease-in-out",
        ":hover": {
          transform: ["unset", "scale(1.3)"]
        },
        ":active": {
          transform: ["scale(1.3)", "unset"]
        },
        ".icon:hover path": {
          fill: "var(--checked) !important"
        }
      }}
      size={isMobile ? 24 : 18}
      onMouseDown={(e) => e.preventDefault()}
      onTouchEnd={(e) => {
        e.preventDefault();
        toggleOutlineList(editor, node, isCollapsed, getPos());
      }}
      onClick={() => {
        toggleOutlineList(editor, node, isCollapsed, getPos());
      }}
    />
  );
}
