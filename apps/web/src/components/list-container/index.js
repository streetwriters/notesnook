import React, { useEffect, useMemo, useRef } from "react";
import { Flex, Button } from "rebass";
import * as Icon from "../icons";
import { Virtuoso } from "react-virtuoso";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import GroupHeader from "../group-header";
import ListProfiles from "../../common/list-profiles";
import { CustomScrollbarsVirtualList } from "../scroll-container";
import ReminderBar from "../reminder-bar";
import Announcements from "../announcements";
import useAnnouncements from "../../utils/use-announcements";

function ListContainer(props) {
  const { type, groupType, items, context, refresh, header } = props;
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
        <>
          {header}
          <Flex variant="columnCenterFill">
            {props.isLoading ? <Icon.Loading rotate /> : <props.placeholder />}
          </Flex>
        </>
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
                  header ? (
                    header
                  ) : announcements.length ? (
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
                    return profile.item(index, item, groupType, context);
                }
              }}
            />
          </Flex>
        </>
      )}
      {props.button && (
        <Button
          variant="primary"
          testId={`${props.type}-action-button`}
          onClick={props.button.onClick}
          sx={{
            alignSelf: "end",
            borderRadius: 100,
            p: 0,
            m: 0,
            mb: 2,
            mr: 2,
            width: 45,
            height: 45,
          }}
        >
          <Icon.Plus color="static" />
        </Button>
      )}
    </Flex>
  );
}
export default ListContainer;
