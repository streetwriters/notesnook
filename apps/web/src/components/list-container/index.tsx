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
import { ListLoader } from "../loaders/list-loader";
import ScrollContainer from "../scroll-container";
import { useKeyboardListNavigation } from "../../hooks/use-keyboard-list-navigation";

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
  groupType?: string;
  compact?: boolean;
  context?: Context;
  refresh: () => void;
  header?: JSX.Element;
  placeholder: () => JSX.Element;
  isLoading?: boolean;
  button?: {
    onClick: () => void;
  };
};

function ListContainer(props: ListContainerProps) {
  const { type, groupType, items, context, refresh, header, button, compact } =
    props;

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

  const groups = useMemo(
    () => props.items.filter((v) => v.type === "header"),
    [props.items]
  );

  useEffect(() => {
    return () => {
      selectionStore.toggleSelectionMode(false);
    };
  }, []);

  const { onFocus, onMouseDown, onKeyDown } = useKeyboardListNavigation({
    length: items.length,
    reset: () => toggleSelection(false),
    deselect: (index) => deselectItem(items[index]),
    select: (index, toggleable) =>
      toggleable && isSelected(items[index])
        ? deselectItem(items[index])
        : selectItem(items[index]),
    bulkSelect: (indices) => setSelectedItems(indices.map((i) => items[i])),
    focusItemAt: (index) => {
      const item = items[index];
      if (!item) return;

      const element = document.getElementById(`id_${item.id}`);
      if (!element) return;
      element.focus();
    },
    skip: (index) => items[index].type === "header",
    open: (index) => {
      const item = items[index];
      if (!item) return;

      const element = document.getElementById(`id_${item.id}`);
      if (!element) return;
      element.click();
    }
  });

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
              <Flex variant="columnCenterFill" data-test-id="list-placeholder">
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
          >
            <Virtuoso
              ref={listRef}
              data={items}
              computeItemKey={(index) => items[index].id || items[index].title}
              defaultItemHeight={DEFAULT_ITEM_HEIGHT}
              totalCount={items.length}
              onBlur={() => setFocusedGroupIndex(-1)}
              onKeyDown={(e) => onKeyDown(e.nativeEvent)}
              overscan={5}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Item: (props) => (
                  <div
                    {...props}
                    style={{ paddingBottom: 1 }}
                    onFocus={() => onFocus(props["data-item-index"])}
                    onMouseDown={(e) =>
                      onMouseDown(e.nativeEvent, props["data-item-index"])
                    }
                  >
                    {props.children}
                  </div>
                ),
                Header: () => (header ? header : <Announcements />)
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
                        compact={compact}
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
