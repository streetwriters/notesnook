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

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { GroupingKey, Item, VirtualizedGrouping } from "@notesnook/core";
import { useResolvedItem } from "@notesnook/common";
import {
  Box,
  Flex,
  VirtualList,
  type KeyEvent,
  type PressEvent,
  type VirtualListHandle
} from "@ui";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { store as selectionStore } from "../../stores/selection-store";
import { ListSelectionContext, type ListSelection } from "./selection";
import GroupHeader from "../group-header";
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
  showGroupCounts?: boolean;
  placeholder: ReactNode;
  isLoading?: boolean;
  isSearching?: boolean;
};

export default function ListContainer(props: ListContainerProps) {
  const { type, group, items, context, header, compact, isSearching } = props;
  const list = useRef<VirtualListHandle>(null);
  const anchor = useRef<number | undefined>(undefined);
  const focused = useRef(0);

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

  const selectRange = useCallback(
    async (from: number, to: number) => {
      const ids = await items.ids();
      const [start, end] = from <= to ? [from, to] : [to, from];
      selectionStore.setSelectedItems(ids.slice(start, end + 1));
    },
    [items]
  );

  const selection = useMemo<ListSelection>(
    () => ({
      onItemPress: (
        index: number,
        id: string,
        event: PressEvent,
        open: () => void
      ) => {
        focused.current = index;
        if (event.shiftKey && anchor.current !== undefined) {
          selectionStore.toggleSelectionMode(true);
          selectRange(anchor.current, index);
          return;
        }
        if (event.metaKey || event.ctrlKey) {
          anchor.current = index;
          if (!selectionStore.get().isSelectionMode)
            selectionStore.toggleSelectionMode(true);
          if (selectionStore.isSelected(id)) selectionStore.deselectItem(id);
          else selectionStore.selectItem(id);
          return;
        }
        anchor.current = index;
        selectionStore.toggleSelectionMode(false);
        open();
      }
    }),
    [selectRange]
  );

  const onKeyDown = useCallback(
    (event: KeyEvent) => {
      const last = items.length - 1;
      const move = (to: number) => {
        const index = Math.max(0, Math.min(last, to));
        focused.current = index;
        list.current?.scrollToIndex({ index, align: "center" });
        if (event.shiftKey) {
          if (anchor.current === undefined) anchor.current = index;
          selectionStore.toggleSelectionMode(true);
          selectRange(anchor.current, index);
        } else {
          anchor.current = index;
          selectionStore.toggleSelectionMode(true);
          items.ids().then((ids) => {
            const id = ids[index];
            if (id) selectionStore.setSelectedItems([id]);
          });
        }
        event.preventDefault();
      };
      switch (event.key) {
        case "ArrowDown":
          return move(focused.current + 1);
        case "ArrowUp":
          return move(focused.current - 1);
        case "Home":
          return move(0);
        case "End":
          return move(last);
        case "Escape":
          selectionStore.toggleSelectionMode(false);
          anchor.current = undefined;
          return;
        case "a":
          if (event.metaKey || event.ctrlKey) {
            selectionStore.toggleSelectionMode(true);
            selectRange(0, last);
            event.preventDefault();
          }
          return;
      }
    },
    [items, selectRange]
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
      />
    ),
    [items, group, compact, context, isSearching, props.showGroupCounts]
  );
  const itemKey = useCallback((index: number) => items.key(index), [items]);
  const listData = useMemo(
    () => ({ compact, items, isSearching, context, group }),
    [compact, items, isSearching, context, group]
  );

  if (!items.length && props.placeholder)
    return (
      <Flex sx={{ flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {header}
        <Flex testID="list-placeholder" sx={{ pt: "spacing6", px: "spacing6" }}>
          {props.placeholder}
        </Flex>
      </Flex>
    );

  return (
    <ListSelectionContext.Provider value={selection}>
      <Flex
        testID={`${type}-list`}
        sx={{ flexDirection: "column", flex: 1, overflow: "hidden" }}
      >
        <VirtualList
          ref={list}
          testID="virtual-list"
          onKeyDown={onKeyDown}
          count={items.length}
          itemKey={itemKey}
          renderItem={renderItem}
          estimatedItemSize={getListItemDefaultHeight(group, compact)}
          extraData={listData}
          header={header}
          overscan={400}
        />
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
      {resolvedItem.group && group ? (
        <GroupHeader
          title={resolvedItem.group.title}
          showGroupCounts={props.showGroupCounts}
        />
      ) : null}
      <ListItemWrapper
        key={resolvedItem.item.id}
        index={index}
        item={resolvedItem.item}
        data={resolvedItem.data}
        context={context}
        group={isSearching ? undefined : group}
        compact={compact}
      />
    </>
  );
}
