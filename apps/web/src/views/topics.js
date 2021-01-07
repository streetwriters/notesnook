import React, { useState, useEffect } from "react";
import { Flex } from "rebass";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { hashNavigate } from "../navigation";

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
          content: "Add a new topic",
          onClick: () => hashNavigate(`/topics/create`),
        }}
      />
    </>
  );
}
export default Topics;
