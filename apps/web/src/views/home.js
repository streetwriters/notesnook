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
      // const note = db.notes.note("f90f344ee3c13c2f686bd5c1").data;
      // const data = await db.content.raw(note.contentId);

      // const note2 = db.notes.note("3e9a515cc63199a101ec49bb").data;
      // const data2 = await db.content.raw(note2.contentId);

      // const data3 = { ...data, conflicted: data2 };

      // await db.content.add(data3);
      // await db.notes.add({ id: note.id, conflicted: true, resolved: false });
      // console.log(data3);
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
        onClick: () => hashNavigate("/notes/create", true),
      }}
    />
  );
}
export default Home;
