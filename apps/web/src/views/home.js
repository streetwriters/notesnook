import React, { useEffect, useState } from "react";
import { useStore, store } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { db } from "../common";

function Home() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async function () {
      await db.notes.init();
      store.refresh();
      setIsLoading(false);
    })();
  }, []);
  const notes = useStore((store) => store.notes);
  const newSession = useEditorStore((store) => store.newSession);

  return (
    <ListContainer
      type="home"
      isLoading={isLoading}
      items={notes}
      placeholder={NotesPlaceholder}
      button={{ content: "Make a new note", onClick: () => newSession() }}
    />
  );
}
export default Home;
