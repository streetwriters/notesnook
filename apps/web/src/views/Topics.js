import React, { useState, useEffect } from "react";
import Topic from "../components/topic";
import { Flex } from "rebass";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { showTopicDialog } from "../components/dialogs/topicdialog";

function Topics(props) {
  const setSelectedNotebookTopics = useNbStore(
    (store) => store.setSelectedNotebookTopics
  );
  const selectedNotebookTopics = useNbStore(
    (store) => store.selectedNotebookTopics
  );

  const [topics, setTopics] = useState([]);
  useEffect(() => {
    setTopics(selectedNotebookTopics);
  }, [selectedNotebookTopics]);

  useEffect(() => {
    setSelectedNotebookTopics(props.notebook.id);
  }, [setSelectedNotebookTopics, props.notebook.id]);

  return (
    <ListContainer
      type="topics"
      items={topics}
      item={(index, item) => (
        <Topic
          index={index}
          item={item}
          onClick={() => {
            let topic = item;
            props.navigator.navigate("notes", {
              title: props.notebook.title,
              subtitle: topic.title,
              context: {
                type: "topic",
                value: { id: props.notebook.id, topic: topic.title },
              },
            });
          }}
        />
      )}
      placeholder={Flex}
      button={{
        content: "Add more topics",
        onClick: async () => {
          await showTopicDialog(props.notebook.id);
        },
      }}
    />
  );
}
export default Topics;
