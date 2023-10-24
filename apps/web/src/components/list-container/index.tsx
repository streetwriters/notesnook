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
  ItemProps,
  ScrollerProps,
  Virtuoso,
  VirtuosoHandle
} from "react-virtuoso";
import {
  useStore as useSelectionStore,
  store as selectionStore
} from "../../stores/selection-store";
import GroupHeader from "../group-header";
import { DEFAULT_ITEM_HEIGHT, ListItemWrapper } from "./list-profiles";
import Announcements from "../announcements";
import { ListLoader } from "../loaders/list-loader";
import ScrollContainer from "../scroll-container";
import { useKeyboardListNavigation } from "../../hooks/use-keyboard-list-navigation";
import { Context } from "./types";
import {
  VirtualizedGrouping,
  GroupHeader as GroupHeaderType,
  GroupingKey,
  Item,
  isGroupHeader
} from "@notesnook/core";

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

  useEffect(() => {
    return () => {
      selectionStore.toggleSelectionMode(false);
    };
  }, []);

  const { onFocus, onMouseDown, onKeyDown } = useKeyboardListNavigation({
    length: items.ids.length,
    reset: () => toggleSelection(false),
    deselect: (index) => deselectItem(items.ids[index]),
    select: (index, toggleable) =>
      toggleable && isSelected(items.ids[index])
        ? deselectItem(items.ids[index])
        : selectItem(items.ids[index]),
    bulkSelect: (indices) => setSelectedItems(indices.map((i) => items.ids[i])),
    focusItemAt: (index) => {
      const item = items.ids[index];
      if (!item || !listRef.current) return;

      waitForElement(listRef.current, index, `id_${item}`, (element) =>
        element.focus()
      );
    },
    skip: (index) => !items.ids[index] || isGroupHeader(items.ids[index]),
    open: (index) => {
      const item = items.ids[index];
      if (!item || !listRef.current) return;

      waitForElement(listRef.current, index, `id_${item}`, (element) =>
        element.click()
      );
    }
  });

  return (
    <Flex variant="columnFill">
      {!props.items.ids.length && props.placeholder ? (
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
              data={items.ids}
              computeItemKey={(index) => items.getKey(index)}
              defaultItemHeight={DEFAULT_ITEM_HEIGHT}
              totalCount={items.ids.length}
              onBlur={() => setFocusedGroupIndex(-1)}
              onKeyDown={(e) => onKeyDown(e.nativeEvent)}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Item: VirtuosoItem,
                Header: () => (header ? header : <Announcements />)
              }}
              context={{
                onMouseDown,
                onFocus
              }}
              itemContent={(index, item) => {
                if (isGroupHeader(item)) {
                  if (!group)
                    return <div style={{ height: 28, width: "100%" }} />;
                  return (
                    <GroupHeader
                      groupingKey={group}
                      refresh={refresh}
                      title={item.title}
                      isFocused={index === focusedGroupIndex}
                      index={index}
                      onSelectGroup={() => {
                        let endIndex;
                        for (
                          let i = index + 1;
                          i < props.items.ids.length;
                          ++i
                        ) {
                          if (typeof props.items.ids[i] === "object") {
                            endIndex = i;
                            break;
                          }
                        }
                        setSelectedItems([
                          ...selectionStore.get().selectedItems,
                          ...props.items.ids.slice(
                            index,
                            endIndex || props.items.ids.length
                          )
                        ]);
                      }}
                      groups={props.items.groups}
                      onJump={(title: string) => {
                        const index = props.items.ids.findIndex(
                          (v) => isGroupHeader(v) && v.title === title
                        );
                        if (index < 0) return;
                        listRef.current?.scrollToIndex({
                          index,
                          align: "center",
                          behavior: "auto"
                        });
                        setFocusedGroupIndex(index);
                      }}
                    />
                  );
                }

                return (
                  <ListItemWrapper
                    key={item}
                    items={items}
                    id={item}
                    context={context}
                    group={group}
                    compact={compact}
                  />
                );
              }}
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
          <Plus color="static" />
        </Button>
      )}
    </Flex>
  );
}
export default ListContainer;

function VirtuosoItem({
  item: _item,
  context,
  ...props
}: ItemProps<string | GroupHeaderType> & {
  context?: {
    onMouseDown: (e: MouseEvent, itemIndex: number) => void;
    onFocus: (itemIndex: number) => void;
  };
}) {
  return (
    <div
      {...props}
      onFocus={() => context?.onFocus(props["data-item-index"])}
      onMouseDown={(e) =>
        context?.onMouseDown(e.nativeEvent, props["data-item-index"])
      }
    >
      {props.children}
    </div>
  );
}

/**
 * Scroll the element at the specified index into view and
 * wait until it renders into the DOM. This function keeps
 * running until the element is found or the max number of
 * attempts have been made. Each attempt is separated by a
 * 50ms interval.
 */
function waitForElement(
  list: VirtuosoHandle,
  index: number,
  elementId: string,
  callback: (element: HTMLElement) => void
) {
  let waitInterval = 0;
  let maxAttempts = 3;
  list.scrollIntoView({
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
