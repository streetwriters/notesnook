import React, { useEffect, useState } from "react";
import { useStore, store } from "../stores/note-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { db } from "../common";
import { hashNavigate } from "../navigation";

function Home() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async function () {
      await db.notes.init();
      store.refresh();
      // const note = db.notes.note("7180399cb8ea4b7dfa015a0f").data;
      // const delta = await db.content.raw(note.contentId);

      // const note2 = db.notes.note("f85150f4a3850fb44dc65569").data;
      // const delta2 = await db.content.raw(note2.contentId);

      // const delta3 = { ...delta, conflicted: delta2 };

      // await db.content.add(delta3);
      // await db.notes.add({ id: note.id, conflicted: true, resolved: false });
      // console.log(delta3);
      setIsLoading(false);
    })();
  }, []);
  const notes = useStore((store) => store.notes);

  return (
    <ListContainer
      type="home"
      isLoading={isLoading}
      items={notes}
      placeholder={NotesPlaceholder}
      button={{
        content: "Make a new note",
        onClick: () => hashNavigate("/notes/create"),
      }}
    />
  );
}
export default Home;
