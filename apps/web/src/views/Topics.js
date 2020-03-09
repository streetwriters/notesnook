import React, { useState, useEffect } from "react";
import Topic from "../components/topic";
import ListContainer from "../components/list-container";
import * as Icon from "react-feather";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useNbStore } from "../stores/notebook-store";
import { showTopicDialog } from "../components/dialogs/topicdialog";

const Topics = props => {
  const setSelectedContext = useNoteStore(store => store.setSelectedContext);
  const setSelectedNotebookTopics = useNbStore(
    store => store.setSelectedNotebookTopics
  );
  const selectedNotebookTopics = useNbStore(
    store => store.selectedNotebookTopics
  );

  const [topics, setTopics] = useState([]);
  useEffect(() => {
    setSelectedNotebookTopics(props.notebook.id);
    setTopics(selectedNotebookTopics);
  }, [selectedNotebookTopics]);

  return (
    <ListContainer
      itemsLength={topics.length}
      item={index => (
        <Topic
          index={index}
          item={topics[index]}
          onClick={() => {
            let topic = topics[index];
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
        content: "Add more topics",
        onClick: async () => {
          await showTopicDialog(Icon.Book, "Topic", props.notebook.id);
        }
      }}
    />
  );
};

export default Topics;
