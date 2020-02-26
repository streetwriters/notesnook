import React from "react";
import { Flex } from "rebass";
import Button from "../button";
import Search from "../search";
import * as Icon from "react-feather";
import { Virtuoso as List } from "react-virtuoso";

const ListContainer = props => {
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Search placeholder="Search" />
      <Flex
        flexDirection="column"
        flex="1 1 auto"
        sx={{
          marginTop: 2
        }}
      >
        <List
          style={{
            width: "100%",
            flex: "1 1 auto",
            height: "auto",
            overflowX: "hidden"
          }}
          totalCount={props.itemsLength}
          item={props.item}
        />
      </Flex>
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
