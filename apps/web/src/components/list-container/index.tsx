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

import { forwardRef, useEffect, useRef, useState } from "react";
import { Flex, Button } from "@theme-ui/components";
import { Plus } from "../icons";
import {
  useStore as useSelectionStore,
  store as selectionStore
} from "../../stores/selection-store";
import GroupHeader from "../group-header";
import {
  ListItemWrapper,
  getListItemDefaultHeight,
  getListItemPlaceholderData
} from "./list-profiles";
import Announcements from "../announcements";
import { ListLoader } from "../loaders/list-loader";
import ScrollContainer from "../scroll-container";
import { useKeyboardListNavigation } from "../../hooks/use-keyboard-list-navigation";
import { VirtualizedGrouping, GroupingKey, Item } from "@notesnook/core";
import {
  FlatScrollIntoViewLocation,
  ItemProps,
  ScrollerProps,
  Virtuoso,
  VirtuosoHandle
} from "react-virtuoso";
import { getRandom, useResolvedItem } from "@notesnook/common";
import { Context } from "./types";
import { AppEventManager, AppEvents } from "../../common/app-events";

export const CustomScrollbarsVirtualList = forwardRef<
  HTMLDivElement,
  ScrollerProps
>(function CustomScrollbarsVirtualList(props, ref) {
  return (
    <ScrollContainer
      {...props}
      forwardedRef={(sRef) => {
        if (typeof ref === "function") ref(sRef);
        else if (ref) ref.current = sRef;
      }}
    />
  );
});

type ListContainerProps = {
  group?: GroupingKey;
  items: VirtualizedGrouping<Item>;
  compact?: boolean;
  context?: Context;
  refresh: () => void;
  header?: JSX.Element;
  placeholder: JSX.Element;
  isLoading?: boolean;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  button?: {
    onClick: () => void;
  };
};
function ListContainer(props: ListContainerProps) {
  const { group, items, context, refresh, header, button, compact } = props;

  const [focusedGroupIndex, setFocusedGroupIndex] = useState(-1);

  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const isSelected = useSelectionStore((store) => store.isSelected);
  const selectItem = useSelectionStore((store) => store.selectItem);
  const deselectItem = useSelectionStore((store) => store.deselectItem);
  const toggleSelection = useSelectionStore(
    (store) => store.toggleSelectionMode
  );

  const listRef = useRef<VirtuosoHandle>(null);
  const listContainerRef = useRef(null);
  // const activeItem = useRef<{ focus: boolean; id: string }>();

  useEffect(() => {
    let flashStartTimeout: NodeJS.Timeout;
    let flashEndTimeout: NodeJS.Timeout;

    AppEventManager.subscribe(
      AppEvents.revealItemInList,
      async (id?: string) => {
        if (!id || !listRef.current) return;

        const ids = await items.ids();
        const index = ids.findIndex((i) => i === id);
        if (index === -1) return;

        listRef.current.scrollToIndex({
          index,
          align: "center",
          behavior: "auto"
        });

        flashStartTimeout = setTimeout(() => {
          const noteItem = document.querySelector(`#id_${id}`);
          if (!noteItem) return;
          noteItem.classList.add("flash");
          flashEndTimeout = setTimeout(() => {
            noteItem.classList.remove("flash");
          }, 1000);
        }, 500);
      }
    );

    return () => {
      clearTimeout(flashStartTimeout);
      clearTimeout(flashEndTimeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      selectionStore.toggleSelectionMode(false);
    };
  }, []);

  const { onMouseUp, onKeyDown } = useKeyboardListNavigation({
    length: items.length,
    reset: () => toggleSelection(false),
    deselect: (index) => {
      const id = items.cacheItem(index)?.item?.id;
      if (!id) return;
      deselectItem(id);
    },
    select: (index, toggleable) => {
      const id = items.cacheItem(index)?.item?.id;
      if (!id) return;
      if (toggleable && isSelected(id)) deselectItem(id);
      else selectItem(id);
    },
    bulkSelect: async (indices) => {
      console.log(indices.length, items.length);
      const ids =
        indices.length === items.length
          ? await items.ids()
          : (indices
              .map((i) => items.cacheItem(i)?.item?.id)
              .filter(Boolean) as string[]);
      setSelectedItems(ids);
    },
    focusItemAt: (index) => {
      const id = items.cacheItem(index)?.item?.id;
      if (!id || !listRef.current) return;

      waitForElement(listRef.current, index, `id_${id}`, (element) =>
        element.focus()
      );
    },
    skip: () => false,
    open: (index) => {
      const id = items.cacheItem(index)?.item?.id;
      if (!id || !listRef.current) return;

      waitForElement(listRef.current, index, `id_${id}`, (element) =>
        element.click()
      );
    }
  });

  return (
    <Flex
      variant="columnFill"
      sx={{ overflow: "hidden" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={props.onDrop}
    >
      {!props.items.length && props.placeholder ? (
        <>
          {header}
          {props.isLoading ? (
            <ListLoader />
          ) : (
            <Flex variant="columnCenterFill" data-test-id="list-placeholder">
              {props.placeholder}
            </Flex>
          )}
        </>
      ) : (
        <>
          <Flex
            ref={listContainerRef}
            variant="columnFill"
            data-test-id={`${group}-list`}
          >
            <Virtuoso
              ref={listRef}
              computeItemKey={(index) => items.key(index)}
              defaultItemHeight={getListItemDefaultHeight(group, compact)}
              totalCount={items.length}
              onBlur={() => setFocusedGroupIndex(-1)}
              onKeyDown={(e) => onKeyDown(e.nativeEvent)}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Item: VirtuosoItem,
                Header: ListHeader
              }}
              increaseViewportBy={{ top: 200, bottom: 200 }}
              context={{
                header,
                items,
                group,
                refresh,
                focusedGroupIndex,
                selectItems: setSelectedItems,
                scrollToIndex: listRef.current?.scrollToIndex,
                focusGroup: setFocusedGroupIndex,
                context,
                compact,
                onMouseUp
              }}
              itemContent={(index, _data, context) => (
                <ItemRenderer context={context} index={index} />
              )}
            />
          </Flex>
        </>
      )}
      {button && (
        <Button
          variant="accent"
          data-test-id={`${group}-action-button`}
          onClick={button.onClick}
          sx={{
            position: "absolute",
            bottom: 0,
            display: ["block", "none", "none"],
            alignSelf: "end",
            borderRadius: 100,
            p: 0,
            m: 0,
            mb: 2,
            mr: 2,
            width: 45,
            height: 45
          }}
        >
          <Plus color="accentForeground" />
        </Button>
      )}
    </Flex>
  );
}
export default ListContainer;

type ListContext = {
  header?: JSX.Element;
  items: VirtualizedGrouping<Item>;
  group: GroupingKey | undefined;
  refresh: () => void;
  focusedGroupIndex: number;
  selectItems: (items: string[]) => void;
  scrollToIndex?: (
    index: number,
    options?: ScrollToOptions | undefined
  ) => void;
  focusGroup: (index: number) => void;
  context?: Context;
  compact?: boolean;

  onMouseUp: (e: MouseEvent, itemIndex: number) => void;
};
function ItemRenderer({
  index,
  context
}: {
  index: number;
  context: ListContext;
}) {
  const {
    items,
    group,
    refresh,
    focusedGroupIndex,
    focusGroup,
    selectItems,
    scrollToIndex,
    context: itemContext,
    compact
  } = context;
  const resolvedItem = useResolvedItem({ index, items });
  if (!resolvedItem || !resolvedItem.item) {
    const placeholderData = getListItemPlaceholderData(group, compact);
    return (
      <div
        key="list-item-skeleton"
        style={{
          display: "flex",
          flexDirection: "column",
          paddingTop: placeholderData.padding[0],
          paddingRight: placeholderData.padding[1],
          paddingBottom: placeholderData.padding[2],
          paddingLeft: placeholderData.padding[3],
          gap: placeholderData.gap
        }}
      >
        {placeholderData.lines.map((line, index) => (
          <div
            key={`${index}`}
            style={{
              height: line.height,
              width:
                line.width === "random" ? `${getRandom(20, 60)}%` : line.width,
              backgroundColor: "var(--background-secondary)",
              borderRadius: line.height / 4
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {resolvedItem.group && group ? (
        <GroupHeader
          groupingKey={group}
          refresh={refresh}
          title={resolvedItem.group.title}
          isFocused={index === focusedGroupIndex}
          index={index}
          onSelectGroup={async () => {
            if (!items.groups) return;

            const groups = await items.groups();
            const groupIndex = groups.findIndex((g) => g.index === index);
            if (groupIndex < 0) return;

            const nextGroupIndex =
              groups[groupIndex + 1]?.index || items.length;

            const ids = await items.ids();

            selectItems([
              ...selectionStore.get().selectedItems,
              ...ids.slice(index, nextGroupIndex)
            ]);
          }}
          groups={async () => (items.groups ? items.groups() : [])}
          onJump={(index) => {
            scrollToIndex?.(index, {
              // align: "center",
              behavior: "auto"
            });
            focusGroup(index);
          }}
        />
      ) : null}
      <ListItemWrapper
        key={resolvedItem.item.id}
        item={resolvedItem.item}
        data={resolvedItem.data}
        context={itemContext}
        group={group}
        compact={compact}
      />
    </>
  );
}

function VirtuosoItem({
  item: _item,
  context,
  ...props
}: ItemProps<string> & {
  context?: ListContext;
}) {
  return (
    <div
      {...props}
      onMouseUp={(e) =>
        context?.onMouseUp(e.nativeEvent, props["data-item-index"])
      }
    >
      {props.children}
    </div>
  );
}

function ListHeader({ context }: { context?: ListContext }) {
  return context?.header ? context.header : <Announcements />;
}

/**
 * Scroll the element at the specified index into view and
 * wait until it renders into the DOM. This function keeps
 * running until the element is found or the max number of
 * attempts have been made. Each attempt is separated by a
 * 50ms interval.
 */
export function waitForElement(
  list: VirtuosoHandle,
  index: number,
  elementId: string,
  callback: (element: HTMLElement) => void,
  options?: Partial<FlatScrollIntoViewLocation>
) {
  let waitInterval = 0;
  let maxAttempts = 3;
  list.scrollIntoView({
    ...options,
    index,
    done: function scrollDone() {
      if (!maxAttempts) return;
      clearTimeout(waitInterval);

      const element = document.getElementById(elementId);
      if (!element) {
        --maxAttempts;
        waitInterval = setTimeout(() => {
          scrollDone();
        }, 50) as unknown as number;
        return;
      }

      callback(element);
    }
  });
}
