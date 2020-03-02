import React from "react";
import Topic from "../components/topic";
import ListContainer from "../components/list-container";
import { useStore } from "../stores/note-store";

const Topics = props => {
  const setSelectedContext = useStore(store => store.setSelectedContext);
  return (
    <ListContainer
      itemsLength={props.topics.length}
      item={index => (
        <Topic
          index={index}
          item={props.topics[index]}
          onClick={() => {
            let topic = props.topics[index];
            setSelectedContext({
              type: "topic",
              value: topic.title,
              notebook: props.notebook
            });
            props.navigator.navigate("notes", {
              title: props.notebook.title,
              subtitle: topic.title
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
