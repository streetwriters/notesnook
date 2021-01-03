import React, { useEffect } from "react";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/notebook-store";
import NotebooksPlaceholder from "../components/placeholders/notebooks-placeholder";
import { hashNavigate } from "../navigation";

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
          onClick: () => hashNavigate("/notebooks/create"),
        }}
      />
    </>
  );
}

export default Notebooks;
