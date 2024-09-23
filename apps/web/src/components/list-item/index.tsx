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
import { ThemeUIStyleObject } from "@theme-ui/css";
import {
  store as selectionStore,
  useStore as useSelectionStore
} from "../../stores/selection-store";
import { useMenuTrigger } from "../../hooks/use-menu";
import React, { useRef } from "react";
import { SchemeColors } from "@notesnook/theme";
import { MenuItem } from "@notesnook/ui";
import { alpha } from "@theme-ui/color";
import { Item } from "@notesnook/core";
import { setDragData } from "../../utils/data-transfer";

type ListItemProps<TItem extends Item, TContext> = {
  colors?: {
    heading: SchemeColors;
    accent: SchemeColors;
    background: SchemeColors;
  };
  isFocused?: boolean;
  isCompact?: boolean;
  isDisabled?: boolean;
  item: TItem;
  draggable?: boolean;

  onKeyPress?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onSelect?: () => void;

  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;

  title: string | JSX.Element;
  header?: JSX.Element;
  body?: JSX.Element | string;
  footer?: JSX.Element;

  context?: TContext;
  menuItems?: (item: TItem, ids?: string[], context?: TContext) => MenuItem[];

  sx?: ThemeUIStyleObject;
};

function ListItem<TItem extends Item, TContext>(
  props: ListItemProps<TItem, TContext>
) {
  const {
    colors: { heading, background, accent } = {
      heading: "heading",
      accent: "accent",
      background: "background"
    },
    isFocused,
    isCompact,
    isDisabled,
    item,
    sx,
    context,
    onDragEnter,
    onDragLeave,
    onDrop,
    draggable
  } = props;

  const listItemRef = useRef<HTMLDivElement>(null);
  const { openMenu, target } = useMenuTrigger();
  const isMenuTarget = target && target === listItemRef.current;

  const isSelected = useSelectionStore((store) => {
    const isInSelection = store.selectedItems.includes(props.item.id);
    return isFocused
      ? store.selectedItems.length > 1 && isInSelection
      : isInSelection;
  });
  const selected = isSelected || isMenuTarget || isFocused;

  return (
    <Flex
      id={`id_${item.id}`}
      className={isSelected ? "selected" : ""}
      ref={listItemRef}
      draggable={draggable}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDragEnd={onDragLeave}
      onDragStart={(e) => {
        if (!draggable) return;
        let selectedItems = selectionStore.get().selectedItems;
        if (selectedItems.findIndex((i) => i === item.id) === -1) {
          selectedItems = [];
          selectedItems.push(item.id);
        }
        setDragData(e.dataTransfer, item.type, selectedItems);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();

        let title = undefined;
        let selectedItems = selectionStore.get().selectedItems; // .filter((i) => i.type === item.type);

        if (selectedItems.findIndex((i) => i === item.id) === -1) {
          selectedItems = [];
          selectedItems.push(item.id);
        }
        let menuItems = props.menuItems?.(item, selectedItems, context);

        if (selectedItems.length > 1) {
          title = `${selectedItems.length} items selected`;
          menuItems = menuItems?.filter((i) => i.multiSelect === true);
        }

        if (!menuItems) return;

        openMenu(menuItems, {
          title
        });
      }}
      tabIndex={-1}
      sx={{
        pl: 1,
        pr: 2,
        py: 1,
        mb: "1px",
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

        backgroundColor: selected ? "background-selected" : background,

        ":hover": {
          backgroundColor: selected ? "hover-selected" : "hover"
        },
        ":focus": {
          backgroundColor: selected ? "hover-selected" : "hover"
        },
        ":focus-visible": {
          outline: `1px solid`,
          outlineColor: accent === "accent" ? "accent" : alpha("accent", 0.7),
          backgroundColor:
            isSelected || isFocused ? "background-selected" : background
        },
        ...sx
      }}
      onKeyUp={(e) => {
        if (e.key !== "Enter") {
          if (props.onKeyPress) props.onKeyPress(e);
        }
      }}
      onClick={(e) => {
        if (!e.metaKey && !e.shiftKey && !e.ctrlKey && props.onClick) {
          props.onClick();
        }
      }}
      onMouseDown={(e) => {
        if (e.button == 1 && props.onMiddleClick) {
          e.preventDefault();
          props.onMiddleClick();
        }
      }}
      data-test-id={`list-item`}
    >
      {!isCompact && props.header}

      {typeof props.title === "string" ? (
        <Text
          dir="auto"
          data-test-id={`title`}
          variant={isCompact ? "body" : "subtitle"}
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: isCompact ? "body" : "bold",
            color:
              selected && heading === "heading"
                ? `${heading}-selected`
                : heading,
            display: "block"
          }}
        >
          {props.title}
        </Text>
      ) : (
        props.title
      )}

      {!isCompact && props.body && (
        <Text
          as="p"
          variant="body"
          dir="auto"
          data-test-id={`description`}
          sx={{
            color: selected ? "paragraph-selected" : "paragraph",
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
