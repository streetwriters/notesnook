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

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Item } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { environment } from "@platform";
import {
  Box,
  Flex,
  Text,
  type ColorValue,
  type ContextMenuEvent,
  type DragEvent,
  type KeyEvent,
  type MenuItem,
  type PressEvent,
  type SxProp
} from "@ui";
import { useListSelection } from "../list-container/selection";
import {
  store as selectionStore,
  useStore as useSelectionStore
} from "../../stores/selection-store";
import { Menu } from "../../hooks/use-menu";
import { setDragData } from "../../utils/data-transfer";
import { useMenuStore } from "../menu/store";

type ListItemColors = {
  heading: ColorValue;
  accent: ColorValue;
  background: ColorValue;
  backgroundSelected: ColorValue;
};

type ListItemProps<TItem extends Item = Item, TContext = unknown> = {
  colors?: ListItemColors;
  isFocused?: boolean;
  isCompact?: boolean;
  isDisabled?: boolean;
  item: TItem;
  index?: number;
  onPress?: (event: PressEvent) => void;
  draggable?: boolean;
  onDragEnter?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
  onMiddleClick?: () => void;
  onKeyPress?: (event: KeyEvent) => void;
  context?: TContext;
  menuItems?: (
    item: TItem,
    ids?: string[],
    context?: TContext
  ) => Promise<MenuItem[]> | MenuItem[];
  title: string | ReactNode;
  header?: ReactNode;
  body?: string | ReactNode;
  footer?: ReactNode;
  sx?: SxProp;
};

const DEFAULT_COLORS: ListItemColors = {
  heading: "heading",
  accent: "accent",
  background: "background",
  backgroundSelected: "background-secondary"
};

export default function ListItem<TItem extends Item, TContext = unknown>(
  props: ListItemProps<TItem, TContext>
) {
  const {
    colors = DEFAULT_COLORS,
    isFocused,
    isCompact,
    isDisabled,
    item
  } = props;
  const selection = useListSelection();
  const [isMenuTarget, setIsMenuTarget] = useState(false);
  const isSelected = useSelectionStore((store) => {
    const isInSelection = store.selectedItems.includes(item.id);
    return isFocused
      ? store.selectedItems.length > 1 && isInSelection
      : isInSelection;
  });
  const isCursor =
    selection !== undefined &&
    props.index !== undefined &&
    selection.focusedIndex === props.index;
  const selected = isSelected || isFocused || isMenuTarget;

  const onPressRef = useRef(props.onPress);
  onPressRef.current = props.onPress;
  useEffect(() => {
    if (!selection || props.index === undefined) return;
    return selection.register(props.index, () =>
      onPressRef.current?.(undefined as never)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, props.index]);

  const openContextMenu = async (event: ContextMenuEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!props.menuItems) return;

    let title: string | undefined = undefined;
    let selectedItems = selectionStore.get().selectedItems;
    if (selectedItems.findIndex((i) => i === item.id) === -1)
      selectedItems = [item.id];

    let menuItems = await props.menuItems(item, selectedItems, props.context);
    if (selectedItems.length > 1) {
      title = strings.itemsSelected(selectedItems.length);
      const multiSelectItemsAndSeparators = menuItems.filter(
        (item) => item.type === "separator" || item.multiSelect === true
      );
      menuItems = multiSelectItemsAndSeparators.filter(
        (item, index, items) =>
          item.type !== "separator" ||
          (items[index - 1]?.multiSelect === true &&
            items[index + 1]?.multiSelect === true)
      );
    }
    if (!menuItems.length) return;

    setIsMenuTarget(true);
    Menu.openMenu(menuItems, {
      title,
      position: { x: event.pageX, y: event.pageY }
    });
    const unsubscribe = useMenuStore.subscribe((state) => {
      if (state.items) return;
      unsubscribe();
      setIsMenuTarget(false);
    });
  };

  return (
    <Flex
      testID="list-item"
      draggable={props.draggable}
      onDragStart={
        props.draggable
          ? () => {
              let selectedItems = selectionStore.get().selectedItems;
              if (selectedItems.findIndex((i) => i === item.id) === -1)
                selectedItems = [item.id];
              return setDragData(item.type, selectedItems);
            }
          : undefined
      }
      droppable={!!props.onDrop}
      onDragEnter={props.onDragEnter}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
      group="list-item"
      onContextMenu={openContextMenu}
      onKeyUp={(event) => {
        if (event.key !== "Enter") props.onKeyPress?.(event);
      }}
      onPress={(event) => {
        if (event.button === "auxiliary") {
          props.onMiddleClick?.();
          return;
        }
        if (selection && props.index !== undefined)
          selection.onItemPress(props.index, item.id, event, () =>
            props.onPress?.(event)
          );
        else props.onPress?.(event);
      }}
      sx={{
        flexDirection: isCompact ? "row" : "column",
        justifyContent: isCompact ? "space-between" : "center",
        alignItems: isCompact ? "center" : "stretch",
        maxWidth: "100%",
        overflow: "hidden",
        opacity: isDisabled ? 0.7 : 1,
        bg: selected
          ? colors.backgroundSelected
          : isCursor
          ? "hover"
          : colors.background,
        ":hover": { bg: selected ? "hover-selected" : "hover" },
        ":drag-over": { bg: selected ? "hover-selected" : "hover" },
        ...props.sx
      }}
    >
      {environment.isDev && selected ? (
        <Box
          testID="list-item-selected"
          sx={{ position: "absolute", width: 0, height: 0 }}
        />
      ) : null}
      {environment.isDev && isCursor ? (
        <Box
          testID="list-item-cursor"
          sx={{ position: "absolute", width: 0, height: 0 }}
        />
      ) : null}
      {!isCompact ? props.header : null}
      <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
        {typeof props.title === "string" ? (
          <Text
            testID="title"
            variant="body"
            sx={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              fontWeight: isCompact ? "body" : "medium",
              color:
                selected && colors.heading === "heading"
                  ? "heading-selected"
                  : colors.heading
            }}
          >
            {props.title}
          </Text>
        ) : (
          props.title
        )}
        {!isCompact && props.body ? (
          typeof props.body === "string" ? (
            <Text
              testID="description"
              numberOfLines={4}
              sx={{
                color: "paragraph",
                fontSize: "xs",
                width: "100%",
                lineHeight: 19.2
              }}
            >
              {props.body}
            </Text>
          ) : (
            props.body
          )
        ) : null}
      </Flex>
      {props.footer}
    </Flex>
  );
}
