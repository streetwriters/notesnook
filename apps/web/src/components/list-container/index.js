import React, { useEffect, useMemo, useRef } from "react";
import { Flex } from "rebass";
import Button from "../button";
import Search from "../search";
import * as Icon from "../icons";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import LoginBar from "../loginbar";
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
          <Search type={props.type} query={props.query} context={context} />
          <LoginBar />
          <Flex variant="columnFill" mt={2}>
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
                          const item = props.items[index];
                          return item.id || item.title;
                        }}
                        overscanCount={2}
                        estimatedItemSize={profile.estimatedItemHeight}
                        itemSize={(index) => {
                          const item = props.items[index];
                          if (item.type === "header") {
                            if (item.title === "Pinned") return 22;
                            else return 22;
                          } else {
                            return profile.itemHeight(item);
                          }
                        }}
                        itemCount={props.items.length}
                      >
                        {({ index, style }) => {
                          const item = props.items[index];
                          return (
                            <div key={item.id} style={style}>
                              {item.type === "header" ? (
                                <GroupHeader title={item.title} />
                              ) : (
                                profile.item(index, item, context)
                              )}
                            </div>
                          );
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
          Icon={props.button.icon || Icon.Plus}
          content={props.button.content}
          onClick={props.button.onClick}
        />
      )}
    </Flex>
  );
}
export default ListContainer;
