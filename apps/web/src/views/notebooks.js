import React, { useEffect } from "react";
import { showAddNotebookDialog } from "../components/dialogs/addnotebookdialog";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/notebook-store";
import NotebooksPlaceholder from "../components/placeholders/notebooks-placeholder";

function Notebooks() {
  useEffect(() => store.refresh(), []);
  const notebooks = useStore((state) => state.notebooks);

  return (
    <>
      <ListContainer
        type="notebooks"
        items={notebooks}
        placeholder={NotebooksPlaceholder}
        button={{
          content: "Create a notebook",
          onClick: showAddNotebookDialog,
        }}
      />
    </>
  );
}

export default Notebooks;
