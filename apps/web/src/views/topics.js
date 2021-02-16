import React from "react";
import { Flex } from "rebass";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { hashNavigate } from "../navigation";

function Topics() {
  const selectedNotebookTopics = useNbStore(
    (store) => store.selectedNotebookTopics
  );
  const selectedNotebookId = useNbStore((store) => store.selectedNotebookId);

  return (
    <>
      <ListContainer
        type="topics"
        items={selectedNotebookTopics}
        context={{ notebookId: selectedNotebookId }}
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
