import React from "react";
import Note from "../components/note";
import ListContainer from "../components/list-container";
import { useStore } from "../stores/editor-store";
import { useStore as useNotesStore } from "../stores/note-store";
import { DEFAULT_CONTEXT } from "../common";

function Notes(props) {
  const newSession = useStore(store => store.newSession);
  const selectedNotes = useNotesStore(store => store.selectedNotes);
  const selectedContext = useNotesStore(store => store.selectedContext);
  return (
    <ListContainer
      type="notes"
      items={selectedNotes}
      item={(index, item) => (
        <Note
          index={index}
          pinnable={false}
          item={item}
          context={selectedContext}
        />
      )}
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
}
export default Notes;
