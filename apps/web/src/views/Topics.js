import React, { useEffect } from "react";
import { Flex } from "rebass";
import Button from "../components/button";
import * as Icon from "react-feather";
import Search from "../components/search";
import { Virtuoso as List } from "react-virtuoso";
import { NotebookNavigator } from "./Notebooks";
import Topic from "../components/topic";
import { db } from "../common";

const Topics = props => {
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Search placeholder="Search" />
      <List
        style={{
          width: "100%",
          flex: "1 1 auto",
          height: "auto",
          overflowX: "hidden"
        }}
        totalCount={props.topics.length}
        item={index => (
          <Topic
            index={index}
            item={props.topics[index]}
            onClick={() => {
              let topic = props.topics[index];
              NotebookNavigator.navigate("notes", {
                title: topic.title,
                notes: db.getTopic(props.notebookId, topic.title)
              });
            }}
          />
        )}
      />
      <Button Icon={Icon.Plus} content={"Add more topics"} />
    </Flex>
  );
};

export default Topics;
