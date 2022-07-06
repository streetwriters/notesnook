import { Box, Flex, Text } from "rebass";
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
import { OutlineList } from "../outline-list/outline-list";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";

export function OutlineListItemComponent(props: ReactNodeViewProps) {
  const { editor, updateAttributes, node, getPos, forwardRef } = props;

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
          mt: isMobile ? "0px" : "3px",
        }}
      >
        {isNested ? (
          <Icon
            path={isCollapsed ? Icons.chevronRight : Icons.chevronDown}
            title={
              isCollapsed
                ? "Click to uncollapse list"
                : "Click to collapse list"
            }
            sx={{
              cursor: "pointer",
              transition: `all .2s ease-in-out`,
              ":hover": {
                transform: ["unset", "scale(1.3)"],
              },
              ":active": {
                transform: ["scale(1.3)", "unset"],
              },
              ".icon:hover path": {
                fill: "var(--checked) !important",
              },
            }}
            size={isMobile ? 24 : 18}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const [subList] = findChildren(
                node,
                (node) => node.type.name === OutlineList.name
              );
              if (!subList) return;
              const { pos } = subList;

              editor.commands.toggleOutlineCollapse(
                pos + getPos() + 1,
                !isCollapsed
              );
            }}
          />
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
              transition: `all .2s ease-in-out`,
              ":hover": {
                backgroundColor: "fontTertiary",
                width: 4,
              },
            }}
            contentEditable={false}
          />
        )}
      </Flex>
      <Text
        ref={forwardRef}
        sx={{
          pl: 2,
          listStyleType: "none",
          flex: 1,
        }}
      />
    </Flex>
  );
}
