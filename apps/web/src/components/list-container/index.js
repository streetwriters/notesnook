import React, { useEffect, useMemo, useRef } from "react";
import { Flex } from "rebass";
import Button from "../button";
import Search from "../search";
import * as Icon from "../icons";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import ReminderBar from "../reminder-bar";
import GroupHeader from "../group-header";
import ListProfiles from "../../common/list-profiles";

function ListContainer(props) {
  const { type, context } = props;
  const profile = useMemo(() => ListProfiles[type], [type]);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const listRef = useRef();

  useEffect(() => {
    if (shouldSelectAll) setSelectedItems(props.items);
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
          <props.placeholder />
        </Flex>
      ) : (
        <>
          <Flex variant="columnFill" mt={2} data-test-id="note-list">
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
                            case 0:
                              return "searchbar";
                            case 1:
                              return "reminderbar";
                            default:
                              const item = props.items[index - 2];
                              return item.id || item.title;
                          }
                        }}
                        overscanCount={3}
                        estimatedItemSize={profile.estimatedItemHeight}
                        itemSize={(index) => {
                          switch (index) {
                            case 0:
                              return 45;
                            case 1:
                              return 85;
                            default:
                              const item = props.items[index - 2];
                              if (item.type === "header") {
                                if (item.title === "Pinned") return 22;
                                else return 22;
                              } else {
                                return profile.itemHeight(item);
                              }
                          }
                        }}
                        itemCount={props.items.length + 2}
                      >
                        {({ index, style }) => {
                          switch (index) {
                            case 0:
                              return (
                                <Search
                                  type={props.type}
                                  query={props.query}
                                  context={context}
                                />
                              );
                            case 1:
                              return <ReminderBar />;
                            default:
                              const item = props.items[index - 2];
                              return (
                                <div key={item.id} style={style}>
                                  {item.type === "header" ? (
                                    <GroupHeader title={item.title} />
                                  ) : (
                                    profile.item(index, item, context)
                                  )}
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
        />
      )}
    </Flex>
  );
}
export default ListContainer;
