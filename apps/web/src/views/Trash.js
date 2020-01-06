import React, { useState, useEffect } from "react";
import { Box, Flex, Text } from "rebass";
import Button from "../components/button";
import { db, ev } from "../common";
import TrashItem from "../components/trash";
import Search from "../components/search";
import * as Icon from "react-feather";
import { Virtuoso as List } from "react-virtuoso";

function Trash() {
  const [trash, setTrash] = useState([]);

  useEffect(() => {
    function onRefreshTrash() {
      setTrash(db.getTrash());
    }
    onRefreshTrash();
    ev.addListener("refreshTrash", onRefreshTrash);
    return () => {
      ev.removeListener("refreshTrash", onRefreshTrash);
    };
  }, []);

  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {trash.length > 0 ? (
        <Flex flexDirection="column" flex="1 1 auto">
          <Search placeholder="Search" />
          <List
            style={{
              width: "100%",
              flex: "1 1 auto",
              height: "auto",
              overflowX: "hidden"
            }}
            totalCount={trash.length}
            item={index => <TrashItem index={index} item={trash[index]} />}
          />
          <Button
            Icon={Icon.Trash2}
            content={"Clear Trash"}
            onClick={db.clearTrash()}
          />
        </Flex>
      ) : (
        <Flex
          flex="1 1 auto"
          alignItems="center"
          justifyContent="center"
          color="#9b9b9b"
          flexDirection="column"
        >
          <Icon.Trash size={72} strokeWidth={1.5} />
          <Text variant="title">You have no trash.</Text>
        </Flex>
      )}
    </Flex>
  );
}

export default Trash;
