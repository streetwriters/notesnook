/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Flex, Button } from "@theme-ui/components";
import * as Icon from "../icons";
import { ScrollerProps, Virtuoso, VirtuosoHandle } from "react-virtuoso";
import {
  useStore as useSelectionStore,
  store as selectionStore
} from "../../stores/selection-store";
import GroupHeader from "../group-header";
import {
  Context,
  DEFAULT_ITEM_HEIGHT,
  Item,
  ListProfiles
} from "./list-profiles";
import ReminderBar from "../reminder-bar";
import Announcements from "../announcements";
import useAnnouncements from "../../hooks/use-announcements";
import { ListLoader } from "../loaders/list-loader";
import ScrollContainer from "../scroll-container";

const CustomScrollbarsVirtualList = forwardRef<HTMLDivElement, ScrollerProps>(
  function CustomScrollbarsVirtualList(props, ref) {
    return (
      <ScrollContainer
        {...props}
        forwardedRef={(sRef) => {
          if (typeof ref === "function") ref(sRef);
          else if (ref) ref.current = sRef;
        }}
      />
    );
  }
);

type ListContainerProps = {
  type: keyof typeof ListProfiles;
  items: Item[];
  groupType: string;
  context: Context;
  refresh: () => void;
  header: JSX.Element;
  placeholder: () => JSX.Element;
  isLoading: boolean;
  button?: {
    onClick: () => void;
  };
};

function ListContainer(props: ListContainerProps) {
  const { type, groupType, items, context, refresh, header, button } = props;

  const [focusedGroupIndex, setFocusedGroupIndex] = useState(-1);

  const [announcements, removeAnnouncement] = useAnnouncements();
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);

  const listRef = useRef<VirtuosoHandle>(null);
  const focusedItemIndex = useRef(-1);
  const listContainerRef = useRef(null);

  const groups = useMemo(
    () => props.items.filter((v) => v.type === "header"),
    [props.items]
  );

  useEffect(() => {
    return () => {
      selectionStore.toggleSelectionMode(false);
    };
  }, []);

  const Component = ListProfiles[type];

  return (
    <Flex variant="columnFill">
      {!props.items.length && props.placeholder ? (
        <>
          {props.isLoading ? (
            <ListLoader />
          ) : (
            <>
              {header || <ReminderBar />}
              <Flex variant="columnCenterFill">
                <props.placeholder />
              </Flex>
            </>
          )}
        </>
      ) : (
        <>
          <Flex
            ref={listContainerRef}
            variant="columnFill"
            data-test-id="note-list"
            onFocus={(e) => {
              if (e.target.parentElement?.dataset.index) {
                focusedItemIndex.current = parseInt(
                  e.target.parentElement.dataset.index
                );
              }
            }}
          >
            <Virtuoso
              ref={listRef}
              data={items}
              computeItemKey={(index) => items[index].id || items[index].title}
              defaultItemHeight={DEFAULT_ITEM_HEIGHT}
              totalCount={items.length}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;

                const listItem = target.closest(
                  `[data-item-index]`
                ) as HTMLElement;
                if (e.shiftKey && listItem && listItem.dataset.index) {
                  e.preventDefault();
                  const endIndex = parseInt(listItem.dataset.index);
                  if (isNaN(endIndex)) return;
                  setSelectedItems([
                    ...selectionStore.get().selectedItems,
                    ...items.slice(focusedItemIndex.current + 1, endIndex + 1)
                  ]);
                  (listItem.firstElementChild as HTMLElement)?.focus();
                }
              }}
              onBlur={() => setFocusedGroupIndex(-1)}
              onKeyDown={(e) => {
                if (e.code === "Escape") {
                  selectionStore.toggleSelectionMode(false);
                  return;
                }

                if (e.code === "KeyA" && e.ctrlKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedItems(
                    items.filter((item) => item.type !== "header")
                  );
                  return;
                }

                // const isShiftKey = e.shiftKey;
                const isUp = e.code === "ArrowUp";
                const isDown = e.code === "ArrowDown";
                const isHeader = (i: number) =>
                  items && items[i]?.type === "header";
                const moveDown = (i: number) =>
                  i < items.length - 1 ? ++i : items.length - 1;
                const moveUp = (i: number) => (i > 0 ? --i : 0);

                const i = focusedItemIndex.current;
                let nextIndex = i;

                if (nextIndex <= -1 && (isUp || isDown)) {
                  nextIndex = 0;
                }

                if (isUp) {
                  nextIndex = moveUp(i);
                  if (isHeader(nextIndex)) nextIndex = moveUp(nextIndex);
                } else if (isDown) {
                  nextIndex = moveDown(i);
                  if (isHeader(nextIndex)) nextIndex = moveDown(nextIndex);
                }

                if (isUp || isDown) {
                  e.preventDefault();

                  listRef.current?.scrollIntoView({
                    index: nextIndex,
                    behavior: "auto",
                    done: () => {
                      const query = `[data-item-index="${nextIndex}"]`;
                      const listItem = document.querySelector(query);
                      if (!listItem) return;
                      (listItem.firstElementChild as HTMLElement)?.focus();
                    }
                  });
                  selectionStore.toggleSelectionMode(false);
                  // if (isShiftKey) {
                  //   const isUp = nextIndex < i; // ? "up" : "down";
                  //   const isBefore = nextIndex < anchorIndex.current; // ? "before" : "after";
                  //   let isSelect = isBefore ? isUp : !isUp;
                  //   const selectedItems = selectionStore
                  //     .get()
                  //     .selectedItems.slice();

                  //   if (isSelect && nextIndex === anchorIndex.current) {
                  //     isSelect = false;
                  //   }

                  //   if (isSelect) selectedItems.push(items[nextIndex]);
                  //   else {
                  //     const indexOfItem = selectedItems.indexOf(items[i]);
                  //     if (indexOfItem <= -1) return;
                  //     selectedItems.splice(indexOfItem, 1);
                  //   }
                  //   setSelectedItems(selectedItems);
                  // } else {
                  //   setSelectedItems([items[nextIndex]]);
                  //   // selectionStore.toggleSelectionMode(false);
                  // }
                }
              }}
              overscan={5}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Item: (props) => (
                  <div {...props} style={{ paddingBottom: 1 }}>
                    {props.children}
                  </div>
                ),
                Header: () =>
                  header ? (
                    header
                  ) : announcements.length ? (
                    <Announcements
                      announcements={announcements}
                      removeAnnouncement={removeAnnouncement}
                    />
                  ) : (
                    <ReminderBar />
                  )
              }}
              itemContent={(index, item) => {
                if (!item) return null;

                switch (item.type) {
                  case "header":
                    return (
                      <GroupHeader
                        type={groupType}
                        refresh={refresh}
                        title={item.title}
                        isFocused={index === focusedGroupIndex}
                        index={index}
                        onSelectGroup={() => {
                          let endIndex;
                          for (let i = index + 1; i < props.items.length; ++i) {
                            if (props.items[i].type === "header") {
                              endIndex = i;
                              break;
                            }
                          }
                          setSelectedItems([
                            ...selectionStore.get().selectedItems,
                            ...props.items.slice(
                              index,
                              endIndex || props.items.length
                            )
                          ]);
                        }}
                        groups={groups}
                        onJump={(title: string) => {
                          const index = props.items.findIndex(
                            (v) => v.title === title
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
                  default:
                    return (
                      <Component
                        item={item}
                        context={context}
                        index={index}
                        type={type}
                      />
                    );
                }
              }}
            />
          </Flex>
        </>
      )}
      {button && (
        <Button
          variant="primary"
          data-test-id={`${props.type}-action-button`}
          onClick={button.onClick}
          sx={{
            position: "absolute",
            bottom: 0,
            display: ["block", "block", "none"],
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
          <Icon.Plus color="static" />
        </Button>
      )}
    </Flex>
  );
}
export default ListContainer;
