import React from "react";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/notebook-store";
import NotebooksPlaceholder from "../components/placeholders/notebooks-placeholder";
import { hashNavigate } from "../navigation";
import useNavigate from "../hooks/use-navigate";

function Notebooks() {
  useNavigate("notebooks", () => store.refresh());
  const notebooks = useStore((state) => state.notebooks);
  const refresh = useStore((state) => state.refresh);

  return (
    <>
      <ListContainer
        type="notebooks"
        groupType="notebooks"
        refresh={refresh}
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
