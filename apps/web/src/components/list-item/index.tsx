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
import {
  store as selectionStore,
  useStore as useSelectionStore
} from "../../stores/selection-store";
import { useMenuTrigger } from "../../hooks/use-menu";
import React, { useRef } from "react";
import { SchemeColors } from "@notesnook/theme";
import { Item } from "../list-container/types";
import { MenuItem } from "@notesnook/ui";
import { alpha } from "@theme-ui/color";

type ListItemProps = {
  colors?: {
    heading: SchemeColors;
    accent: SchemeColors;
    background: SchemeColors;
  };
  isFocused?: boolean;
  isCompact?: boolean;
  isDisabled?: boolean;
  isSimple?: boolean;
  item: Item;

  onKeyPress?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  title: string | JSX.Element;
  header?: JSX.Element;
  body?: JSX.Element | string;
  footer?: JSX.Element;

  menuItems?: (item: any, items?: any[]) => MenuItem[];
};

function ListItem(props: ListItemProps) {
  const {
    colors: { heading, background, accent } = {
      heading: "heading",
      accent: "accent",
      background: "background"
    },
    isFocused,
    isCompact,
    isDisabled,
    isSimple,
    item
  } = props;

  const listItemRef = useRef<HTMLDivElement>(null);
  const { openMenu, target } = useMenuTrigger();
  const isMenuTarget = target && target === listItemRef.current;

  const isSelected = useSelectionStore((store) => {
    const isInSelection =
      store.selectedItems.findIndex((item) => item.id === props.item.id) > -1;
    return isFocused
      ? store.selectedItems.length > 1 && isInSelection
      : isInSelection;
  });

  return (
    <Flex
      id={`id_${item.id}`}
      className={isSelected ? "selected" : ""}
      ref={listItemRef}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();

        let title = undefined;
        let selectedItems = selectionStore
          .get()
          .selectedItems.filter((i) => i.type === item.type);

        if (selectedItems.findIndex((i) => i.id === item.id) === -1) {
          selectedItems = [];
          selectedItems.push(item);
        }

        let menuItems = props.menuItems?.(item, selectedItems);

        if (selectedItems.length > 1) {
          title = `${selectedItems.length} items selected`;
          menuItems = menuItems?.filter((i) => i.multiSelect === true);
        }

        if (!menuItems) return;

        openMenu(menuItems, {
          title
        });
      }}
      pl={1}
      pr={2}
      py={1}
      mb={isCompact ? 0 : 1}
      tabIndex={-1}
      dir="auto"
      sx={{
        height: "inherit",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        maxWidth: "100%",

        flexDirection: isCompact ? "row" : "column",
        justifyContent: isCompact ? "space-between" : "center",
        alignItems: isCompact ? "center" : undefined,

        opacity: isDisabled ? 0.7 : 1,

        borderLeft: "5px solid",
        borderLeftColor: isFocused ? accent : "transparent",
        ml: "2px",
        mr: "1px",

        backgroundColor:
          isSelected || isMenuTarget || isFocused
            ? "background-selected"
            : background,

        ":hover": {
          backgroundColor: isSelected ? "hover-selected" : "hover"
        },
        ":focus": {
          backgroundColor: isSelected ? "hover-selected" : "hover"
        },
        ":focus-visible": {
          outline: `1px solid`,
          outlineColor: accent === "accent" ? "accent" : alpha("accent", 0.7),
          backgroundColor: isSelected ? "textSelection" : background
        }
      }}
      onKeyPress={(e) => {
        if (e.key !== "Enter") {
          if (props.onKeyPress) props.onKeyPress(e);
        }
      }}
      onClick={(e) => {
        if (!e.metaKey && !e.shiftKey && !e.ctrlKey && props.onClick) {
          props.onClick();
        }
      }}
      data-test-id={`list-item`}
    >
      {!isCompact && props.header}

      <Text
        data-test-id={`title`}
        variant={isSimple || isCompact ? "body" : "subtitle"}
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontWeight: isCompact || isSimple ? "body" : "bold",
          color: heading,
          display: "block"
        }}
      >
        {props.title}
      </Text>

      {!isSimple && !isCompact && props.body && (
        <Text
          as="p"
          variant="body"
          data-test-id={`description`}
          sx={{
            lineHeight: `1.2rem`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "pre-wrap",
            position: "relative",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical"
          }}
        >
          {props.body}
        </Text>
      )}
      {props.footer ? (
        <Box
          ml={isCompact ? 1 : 0}
          mt={isCompact ? 0 : 1}
          sx={{ flexShrink: 0 }}
        >
          {props.footer}
        </Box>
      ) : null}
    </Flex>
  );
}
export default ListItem;
