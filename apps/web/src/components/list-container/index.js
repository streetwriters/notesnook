import React, { useEffect } from "react";
import { Flex } from "rebass";
import Button from "../button";
import Search from "../search";
import * as Icon from "../icons";
import { Virtuoso as List } from "react-virtuoso";
import { useStore as useSearchStore } from "../../stores/searchstore";
import { useStore as useAppStore } from "../../stores/app-store";

const ListContainer = props => {
  const setSearchContext = useSearchStore(store => store.setSearchContext);
  const shouldSelectAll = useAppStore(store => store.shouldSelectAll);
  const setSelectedItems = useAppStore(store => store.setSelectedItems);
  useEffect(() => {
    if (shouldSelectAll) setSelectedItems(props.items);
  }, [shouldSelectAll, setSelectedItems, props.items]);

  useEffect(() => {
    if (props.noSearch) return;
    setSearchContext({
      items: props.items,
      item: props.item,
      type: props.type
    });
  }, [setSearchContext, props.item, props.items, props.type, props.noSearch]);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {!props.items.length && props.placeholder ? (
        <Flex
          flexDirection="column"
          alignSelf="center"
          justifyContent="center"
          flex="1 1 auto"
        >
          <props.placeholder />
        </Flex>
      ) : (
        <>
          {!props.noSearch && <Search type={props.type} />}
          <Flex
            flexDirection="column"
            flex="1 1 auto"
            sx={{
              marginTop: 2
            }}
          >
            {props.children || (
              <List
                style={{
                  width: "100%",
                  flex: "1 1 auto",
                  height: "auto",
                  overflowX: "hidden"
                }}
                totalCount={props.items.length}
                item={index => props.item(index, props.items[index])}
              />
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
};

export default ListContainer;
