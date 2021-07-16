import React from "react";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { hashNavigate } from "../navigation";
import TopicsPlaceholder from "../components/placeholders/topics-placeholder";

function Topics() {
  const selectedNotebookTopics = useNbStore(
    (store) => store.selectedNotebookTopics
  );
  const selectedNotebookId = useNbStore((store) => store.selectedNotebookId);
  const refresh = useNbStore((store) => store.setSelectedNotebook);

  return (
    <>
      <ListContainer
        type="topics"
        groupType="topics"
        refresh={() => refresh(selectedNotebookId)}
        items={selectedNotebookTopics}
        context={{ notebookId: selectedNotebookId }}
        placeholder={TopicsPlaceholder}
        button={{
          content: "Add a new topic",
          onClick: () => hashNavigate(`/topics/create`),
        }}
      />
    </>
  );
}
export default Topics;
