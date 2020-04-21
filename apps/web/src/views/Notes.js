import React, { useEffect } from "react";
import Note from "../components/note";
import ListContainer from "../components/list-container";
import { useStore } from "../stores/editor-store";
import { useStore as useNotesStore } from "../stores/note-store";

function Notes(props) {
  const newSession = useStore((store) => store.newSession);
  const context = useNotesStore((store) => store.context);
  const setContext = useNotesStore((store) => store.setContext);

  useEffect(() => {
    if (props.context) {
      setContext(props.context);
    }
  }, [props.context, setContext]);

  if (!context) return null;
  return (
    <ListContainer
      type="notes"
      items={context.notes}
      item={(index, item) => (
        <Note index={index} pinnable={false} item={item} context={context} />
      )}
      button={{
        content: "Make a new note",
        onClick: () => newSession(props.context),
      }}
    />
  );
}
export default Notes;
