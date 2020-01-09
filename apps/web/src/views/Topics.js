import React from "react";
import Topic from "../components/topic";
import { db } from "../common";
import ListContainer from "../components/list-container";
import NotebookNavigator from "../navigation/navigators/nbnavigator";

const Topics = props => {
  return (
    <ListContainer
      itemsLength={props.topics.length}
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
      button={{
        content: "Add more topics"
      }}
    />
  );
};

export default Topics;
