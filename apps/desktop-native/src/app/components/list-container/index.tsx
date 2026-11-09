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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { GroupingKey, Item, VirtualizedGrouping } from "@notesnook/core";
import { useResolvedItem } from "../../hooks/use-resolved-item";
import {
  Box,
  Button,
  Flex,
  VirtualList,
  type PressEvent,
  type DragEvent,
  type SxProp,
  type VirtualListHandle
} from "@ui";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { store as selectionStore } from "../../stores/selection-store";
import { useKeyboardListNavigation } from "../../hooks/use-keyboard-list-navigation";
import { ListSelectionContext, type ListSelection } from "./selection";
import GroupHeader from "../group-header";
import Announcements from "../announcements";
import { ListLoader } from "../loaders/list-loader";
import { Plus, type Icon } from "../icons";
import {
  getListItemDefaultHeight,
  getListItemPlaceholderData,
  ListItemWrapper
} from "./list-profiles";
import type { Context } from "./types";

type ListContainerProps = {
  type: GroupingKey;
  group?: GroupingKey;
  items: VirtualizedGrouping<Item>;
  compact?: boolean;
  context?: Context;
  refresh: () => void;
  header?: ReactNode;
  renderGroupHeader?: (title: string, index: number) => ReactNode;
  showGroupCounts?: boolean;
  placeholder: ReactNode;
  isLoading?: boolean;
  isSearching?: boolean;
  button?: {
    Icon?: Icon;
    onClick: () => void;
  };
  sx?: SxProp;
  placeholderSx?: SxProp;
  onDrop?: (event: DragEvent) => void;
};

export default function ListContainer(props: ListContainerProps) {
  const { type, group, items, context, header, compact, isSearching } = props;
  const list = useRef<VirtualListHandle>(null);
  const openers = useRef(new Map<number, () => void>());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedGroupIndex, setFocusedGroupIndex] = useState(-1);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.revealItemInList,
      async (id?: string) => {
        if (!id || !list.current) return;
        const ids = await items.ids();
        const index = ids.findIndex((i) => i === id);
        if (index === -1) return;
        list.current.scrollToIndex({ index, align: "center" });
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [items]);

  useEffect(() => {
    return () => {
      selectionStore.toggleSelectionMode(false);
    };
  }, []);

  const idAt = useCallback(
    (index: number) => items.cacheItem(index)?.item?.id,
    [items]
  );

  const { onMouseUp, onKeyDown } = useKeyboardListNavigation({
    length: items.length,
    reset: () => selectionStore.toggleSelectionMode(false),
    deselect: (index) => {
      const id = idAt(index);
      if (id) selectionStore.deselectItem(id);
    },
    select: (index, toggleable) => {
      const id = idAt(index);
      if (!id) return;
      if (toggleable && selectionStore.isSelected(id))
        selectionStore.deselectItem(id);
      else selectionStore.selectItem(id);
    },
    bulkSelect: async (indices) => {
      const ids =
        indices.length === items.length
          ? await items.ids()
          : (indices.map((i) => idAt(i)).filter(Boolean) as string[]);
      selectionStore.setSelectedItems(ids);
    },
    focusItemAt: (index) => {
      setFocusedIndex(index);
      list.current?.scrollToIndex({ index });
    },
    skip: () => false,
    open: (index) => openers.current.get(index)?.()
  });

  const selection = useMemo<ListSelection>(
    () => ({
      focusedIndex,
      register: (index, open) => {
        openers.current.set(index, open);
        return () => {
          if (openers.current.get(index) === open)
            openers.current.delete(index);
        };
      },
      onItemPress: (
        index: number,
        _id: string,
        event: PressEvent,
        open: () => void
      ) => {
        onMouseUp(
          {
            button: event.button,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey
          },
          index
        );
        setFocusedIndex(index);
        if (!event.metaKey && !event.shiftKey && !event.ctrlKey) open();
      }
    }),
    [onMouseUp, focusedIndex]
  );

  const renderItem = useCallback(
    (index: number) => (
      <ItemRenderer
        index={index}
        items={items}
        group={group}
        compact={compact}
        context={context}
        isSearching={isSearching}
        showGroupCounts={props.showGroupCounts}
        renderGroupHeader={props.renderGroupHeader}
        focusedGroupIndex={focusedGroupIndex}
        focusGroup={setFocusedGroupIndex}
        scrollToIndex={(index) => list.current?.scrollToIndex({ index })}
      />
    ),
    [
      items,
      group,
      compact,
      context,
      isSearching,
      props.showGroupCounts,
      props.renderGroupHeader,
      focusedGroupIndex
    ]
  );
  const itemKey = useCallback((index: number) => items.key(index), [items]);
  const listData = useMemo(
    () => ({
      compact,
      items,
      isSearching,
      context,
      group,
      focusedGroupIndex
    }),
    [compact, items, isSearching, context, group, focusedGroupIndex]
  );

  if (!items.length && props.placeholder)
    return (
      <Flex
        sx={{
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          ...props.sx
        }}
      >
        {header}
        {props.isLoading ? (
          <ListLoader />
        ) : (
          <Flex
            testID="list-placeholder"
            sx={{
              flexDirection: "row",
              pt: "spacing6",
              px: "spacing6",
              ...props.placeholderSx
            }}
          >
            {props.placeholder}
          </Flex>
        )}
      </Flex>
    );

  return (
    <ListSelectionContext.Provider value={selection}>
      <Flex
        testID={`${type}-list`}
        droppable={!!props.onDrop}
        onDrop={props.onDrop}
        sx={{
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          ...props.sx
        }}
      >
        <VirtualList
          ref={list}
          testID="virtual-list"
          onKeyDown={onKeyDown}
          onBlur={() => {
            setFocusedGroupIndex(-1);
            setFocusedIndex(-1);
          }}
          count={items.length}
          itemKey={itemKey}
          renderItem={renderItem}
          estimatedItemSize={getListItemDefaultHeight(group, compact)}
          extraData={listData}
          header={header ?? <Announcements />}
          overscan={200}
        />
        {props.button ? (
          <Button
            variant="accent"
            testID={`${group}-action-button`}
            onPress={props.button.onClick}
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              display: ["flex", "none", "none"],
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 100,
              p: 0,
              m: 0,
              mb: 2,
              mr: 2,
              width: 45,
              height: 45
            }}
          >
            {props.button.Icon ? (
              <props.button.Icon color="accentForeground" />
            ) : (
              <Plus color="accentForeground" />
            )}
          </Button>
        ) : null}
      </Flex>
    </ListSelectionContext.Provider>
  );
}

function ItemRenderer(props: {
  index: number;
  items: VirtualizedGrouping<Item>;
  group?: GroupingKey;
  compact?: boolean;
  context?: Context;
  isSearching?: boolean;
  showGroupCounts?: boolean;
  renderGroupHeader?: (title: string, index: number) => ReactNode;
  focusedGroupIndex: number;
  focusGroup: (index: number) => void;
  scrollToIndex: (index: number) => void;
}) {
  const { index, items, group, compact, context, isSearching } = props;
  const resolvedItem = useResolvedItem({ index, items });

  if (!resolvedItem || !resolvedItem.item) {
    const placeholder = getListItemPlaceholderData(group, compact);
    return (
      <Flex
        testID="list-item-skeleton"
        sx={{
          flexDirection: "column",
          pt: placeholder.padding[0],
          pr: placeholder.padding[1],
          pb: placeholder.padding[2],
          pl: placeholder.padding[3],
          gap: placeholder.gap ?? 0
        }}
      >
        {placeholder.lines.map((line, lineIndex) => (
          <Box
            key={lineIndex}
            sx={{
              height: line.height,
              width:
                line.width === "random"
                  ? "40%"
                  : (line.width as `${number}%` | number),
              bg: "background-secondary",
              borderRadius: line.height / 4
            }}
          />
        ))}
      </Flex>
    );
  }

  return (
    <>
      {resolvedItem.group && group && props.renderGroupHeader ? (
        props.renderGroupHeader(resolvedItem.group.title, index)
      ) : resolvedItem.group && group ? (
        <GroupHeader
          title={resolvedItem.group.title}
          showGroupCounts={props.showGroupCounts}
          isFocused={index === props.focusedGroupIndex}
          onSelectGroup={async () => {
            if (!items.groups) return;
            const groups = await items.groups();
            const groupIndex = groups.findIndex((g) => g.index === index);
            if (groupIndex < 0) return;
            const nextGroupIndex =
              groups[groupIndex + 1]?.index || items.length;
            const ids = await items.ids();
            selectionStore.setSelectedItems([
              ...selectionStore.get().selectedItems,
              ...ids.slice(index, nextGroupIndex)
            ]);
          }}
          groups={async () => (items.groups ? items.groups() : [])}
          onJump={(groupStart) => {
            props.scrollToIndex(groupStart);
            props.focusGroup(groupStart);
          }}
        />
      ) : null}
      <ListItemWrapper
        key={resolvedItem.item.id}
        index={index}
        item={resolvedItem.item}
        data={resolvedItem.data}
        context={context}
        group={isSearching ? "search" : group}
        compact={compact}
      />
    </>
  );
}
