import React, { useEffect } from "react";
import { Flex } from "rebass";
import Button from "../button";
import Search from "../search";
import * as Icon from "../icons";
import { Virtuoso as List } from "react-virtuoso";
import { useStore as useSearchStore } from "../../stores/searchstore";
import { useStore as useSelectionStore } from "../../stores/selection-store";

function ListContainer(props) {
  const setSearchContext = useSearchStore((store) => store.setSearchContext);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);

  useEffect(() => {
    if (shouldSelectAll) setSelectedItems(props.items);
  }, [shouldSelectAll, setSelectedItems, props.items]);

  useEffect(() => {
    if (props.noSearch) return;
    setSearchContext({
      items: props.items,
      item: props.item,
      type: props.type,
    });
  }, [setSearchContext, props.item, props.items, props.type, props.noSearch]);

  return (
    <Flex variant="columnFill">
      {!props.items.length && props.placeholder ? (
        <Flex variant="columnCenterFill">
          <props.placeholder />
        </Flex>
      ) : (
        <>
          {!props.noSearch && <Search type={props.type} />}
          <Flex variant="columnFill" mt={2}>
            {props.children || props.items.length > 0 ? (
              <List
                style={{
                  width: "100%",
                  flex: "1 1 auto",
                  height: "auto",
                  overflowX: "hidden",
                }}
                totalCount={props.items.length}
                item={(index) => props.item(index, props.items[index])}
              />
            ) : null}
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
