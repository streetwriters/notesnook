import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flex } from "rebass";
import Button from "../button";
import * as Icon from "../icons";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import GroupHeader from "../group-header";
import ListProfiles from "../../common/list-profiles";
import ScrollContainer from "../scroll-container";
import ReminderBar from "../reminder-bar";
import Announcements from "../announcements";
import useAnnouncements from "../../utils/use-announcements";

const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => (
  <ScrollContainer {...props} forwardedRef={ref} />
));

function ListContainer(props) {
  const { type, context } = props;
  const [announcements, removeAnnouncement] = useAnnouncements();
  const profile = useMemo(() => ListProfiles[type], [type]);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const [jumpToIndex, setJumpToIndex] = useState(-1);
  const listRef = useRef();

  useEffect(() => {
    if (!props.items.length) return;
    if (shouldSelectAll)
      setSelectedItems(props.items.filter((item) => item.type !== "header"));
  }, [shouldSelectAll, setSelectedItems, props.items]);

  useEffect(() => {
    if (props.static) return;
    // whenever there is a change in items array we have to reset the size cache
    // so it can be recalculated.
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [props.items, listRef, props.static]);

  return (
    <Flex variant="columnFill">
      {!props.items.length && props.placeholder ? (
        <Flex variant="columnCenterFill">
          {props.isLoading ? <Icon.Loading rotate /> : <props.placeholder />}
        </Flex>
      ) : (
        <>
          {announcements.length ? (
            <Announcements
              announcements={announcements}
              removeAnnouncement={removeAnnouncement}
            />
          ) : (
            <ReminderBar />
          )}
          <Flex variant="columnFill" data-test-id="note-list">
            {props.children
              ? props.children
              : props.items.length > 0 && (
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        ref={listRef}
                        height={height}
                        width={width}
                        itemKey={(index) => {
                          switch (index) {
                            default:
                              const item = props.items[index];
                              if (!item) return "";
                              return item.id || item.title;
                          }
                        }}
                        outerElementType={CustomScrollbarsVirtualList}
                        overscanCount={3}
                        estimatedItemSize={profile.estimatedItemHeight}
                        itemSize={(index) => {
                          const item = props.items[index];
                          if (!item) return 0;
                          if (item.type === "header") {
                            if (!item.title) return 0;
                            return 29;
                          } else {
                            return profile.itemHeight(item);
                          }
                        }}
                        itemCount={props.items.length}
                      >
                        {({ index, style }) => {
                          //const item = pinnedItems[index] || props.items[pinnedItems.length + index];
                          const item = props.items[index];
                          if (!item) return null;

                          switch (item.type) {
                            case "header":
                              return (
                                <div
                                  key={item.id || item.title}
                                  style={{
                                    ...style,
                                    zIndex: !index ? 3 : 2,
                                  }}
                                >
                                  <GroupHeader
                                    title={item.title}
                                    index={index}
                                    groups={props.items.filter(
                                      (v) =>
                                        v.type === "header" &&
                                        v.title !== item.title
                                    )}
                                    wasJumpedTo={index === jumpToIndex}
                                    onJump={(title) => {
                                      const index = props.items.findIndex(
                                        (v) => v.title === title
                                      );
                                      if (index < 0) return;
                                      setJumpToIndex(index);
                                      listRef.current.scrollToItem(
                                        index,
                                        "center"
                                      );
                                      setTimeout(() => {
                                        setJumpToIndex(-1);
                                      }, 1900);
                                    }}
                                  />
                                </div>
                              );
                            default:
                              return (
                                <div
                                  key={item.id || item.title}
                                  style={{
                                    ...style,
                                    zIndex: 1,
                                  }}
                                >
                                  {profile.item(index, item, context)}
                                </div>
                              );
                          }
                        }}
                      </List>
                    )}
                  </AutoSizer>
                )}
          </Flex>
        </>
      )}
      {props.button && (
        <Button
          testId={`${props.type}-action-button`}
          Icon={props.button.icon || Icon.Plus}
          content={props.button.content}
          onClick={props.button.onClick}
          show={props.button.show}
        />
      )}
    </Flex>
  );
}
export default ListContainer;
