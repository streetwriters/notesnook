import React, { useEffect, useMemo, useRef } from "react";
import { Flex } from "rebass";
import Button from "../button";
import * as Icon from "../icons";
import { Virtuoso } from "react-virtuoso";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import GroupHeader from "../group-header";
import ListProfiles from "../../common/list-profiles";
import ScrollContainer from "../scroll-container";
import ReminderBar from "../reminder-bar";
import Announcements from "../announcements";
import useAnnouncements from "../../utils/use-announcements";

const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => (
  <ScrollContainer
    {...props}
    forwardedRef={(scrollbarsRef) => (ref.current = scrollbarsRef)}
  />
));

function ListContainer(props) {
  const { type, groupType, items, context, refresh } = props;
  const [announcements, removeAnnouncement] = useAnnouncements();
  const profile = useMemo(() => ListProfiles[type], [type]);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const listRef = useRef();

  useEffect(() => {
    if (shouldSelectAll && window.currentViewKey === type)
      setSelectedItems(items.filter((item) => item.type !== "header"));
  }, [shouldSelectAll, type, setSelectedItems, items]);

  return (
    <Flex variant="columnFill">
      {!props.items.length && props.placeholder ? (
        <Flex variant="columnCenterFill">
          {props.isLoading ? <Icon.Loading rotate /> : <props.placeholder />}
        </Flex>
      ) : (
        <>
          <Flex variant="columnFill" data-test-id="note-list">
            <Virtuoso
              ref={listRef}
              data={items}
              computeItemKey={(index) => items[index].id || items[index].title}
              defaultItemHeight={profile.estimatedItemHeight}
              totalCount={items.length}
              // overscan={10}
              components={{
                Scroller: CustomScrollbarsVirtualList,
                Header: () =>
                  announcements.length ? (
                    <Announcements
                      announcements={announcements}
                      removeAnnouncement={removeAnnouncement}
                    />
                  ) : (
                    <ReminderBar />
                  ),
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
                        index={index}
                        groups={props.items.filter((v) => v.type === "header")}
                        onJump={(title) => {
                          const index = props.items.findIndex(
                            (v) => v.title === title
                          );
                          if (index < 0) return;
                          listRef.current.scrollToIndex({
                            index,
                            align: "center",
                            behavior: "smooth",
                          });
                        }}
                      />
                    );
                  default:
                    return profile.item(index, item, context);
                }
              }}
            />
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
