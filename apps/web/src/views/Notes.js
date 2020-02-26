import React, { useEffect } from "react";
import Note from "../components/note";
import ListContainer from "../components/list-container";
import { useStore } from "../stores/editor-store";
import { useStore as useNotesStore } from "../stores/note-store";
import { DEFAULT_CONTEXT } from "../common";

const Notes = props => {
  const newSession = useStore(store => store.newSession);
  const selectedNotes = useNotesStore(store => store.selectedNotes);
  const clearSelectedContext = useNotesStore(
    store => store.clearSelectedContext
  );
  useEffect(() => {
    return () => {
      clearSelectedContext();
    };
  }, [clearSelectedContext]);
  return (
    <ListContainer
      item={index => <Note index={index} item={selectedNotes[index]} />}
      itemsLength={selectedNotes.length}
      button={{
        content: "Make a new note",
        onClick: () =>
          newSession({
            ...DEFAULT_CONTEXT,
            ...props.context
          })
      }}
    />
  );
};

export default Notes;
