import React, { useEffect, useState } from "react";
import ListContainer from "../components/list-container";
import { useStore as useNotesStore } from "../stores/note-store";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { db } from "../common";
import { hashNavigate } from "../navigation";

function Notes(props) {
  const [isLoading, setIsLoading] = useState(true);
  const context = useNotesStore((store) => store.context);
  const setContext = useNotesStore((store) => store.setContext);

  useEffect(() => {
    (async function () {
      await db.notes.init();
      if (props.context) {
        setContext(props.context);
      }
      setIsLoading(false);
    })();
  }, [props.context, setContext]);

  if (!context) return null;

  return (
    <ListContainer
      type="notes"
      isLoading={isLoading}
      context={context}
      items={context.notes}
      placeholder={props.placeholder || NotesPlaceholder}
      button={{
        content: "Make a new note",
        onClick: () => hashNavigate("/notes/create", true),
      }}
    />
  );
}
export default Notes;
