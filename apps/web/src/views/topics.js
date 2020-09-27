import React, { useState, useEffect } from "react";
import { Flex } from "rebass";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { showTopicDialog } from "../components/dialogs/topicdialog";

function Topics(props) {
  const { notebookId } = props;

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
    setSelectedNotebookTopics(notebookId);
  }, [setSelectedNotebookTopics, notebookId]);

  return (
    <>
      <ListContainer
        type="topics"
        items={topics}
        context={{ notebookId }}
        placeholder={Flex}
        button={{
          content: "Create a new topic",
          onClick: async () => {
            await showTopicDialog(notebookId);
          },
        }}
      />
    </>
  );
}
export default Topics;
