import React, { useEffect } from "react";
import { useStore, store } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";

function Home() {
  useEffect(() => store.refresh(), []);
  const notes = useStore((store) => store.notes);
  const newSession = useEditorStore((store) => store.newSession);

  return (
    <ListContainer
      type="home"
      items={notes}
      placeholder={NotesPlaceholder}
      button={{ content: "Make a new note", onClick: () => newSession() }}
    />
  );
}
export default Home;
