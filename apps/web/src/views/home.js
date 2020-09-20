import React, { useEffect } from "react";
import Note from "../components/note";
import { useStore, store } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { getNoteHeight, MAX_HEIGHTS } from "../common/height-calculator";

function Home() {
  useEffect(() => store.refresh(), []);
  const notes = useStore((store) => store.notes);
  const newSession = useEditorStore((store) => store.newSession);

  return (
    <ListContainer
      type="notes"
      items={notes}
      estimatedItemHeight={MAX_HEIGHTS.note}
      itemHeight={getNoteHeight}
      item={(index, item) => <Note index={index} pinnable item={item} />}
      placeholder={NotesPlaceholder}
      button={{ content: "Make a new note", onClick: () => newSession() }}
    />
  );
}
export default Home;
