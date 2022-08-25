import React, { useEffect, useState } from "react";
import { useStore, store } from "../stores/note-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { db } from "../common/db";
import { hashNavigate } from "../navigation";
import useNavigate from "../hooks/use-navigate";

function Home() {
  useStore((store) => store.nonce);
  const notes = useStore((store) => store.notes);
  const refresh = useStore((store) => store.refresh);
  const clearContext = useStore((store) => store.clearContext);
  const [isLoading, setIsLoading] = useState(true);
  useNavigate("home", () => {
    clearContext();
  });

  useEffect(() => {
    (async function () {
      const initialized = db.notes.initialized;
      if (!initialized || !notes.length) {
        await db.notes.init();
        store.refresh();
        setIsLoading(false);
      }
      // const note = db.notes.note("62bc3f28a1a1a10000707077").data;
      // const data = await db.content.raw(note.contentId);

      // const note2 = db.notes.note("62bc3f1ca1a1a10000707075").data;
      // const data2 = await db.content.raw(note2.contentId);

      // const data3 = { ...data, conflicted: data2 };

      // await db.content.add(data3);
      // await db.notes.add({ id: note.id, conflicted: true, resolved: false });
      // console.log(data3);
    })();
  }, [notes.length]);

  return (
    <ListContainer
      type="home"
      groupType="home"
      refresh={refresh}
      isLoading={isLoading}
      items={notes}
      placeholder={NotesPlaceholder}
      button={{
        content: "Make a new note",
        onClick: () =>
          hashNavigate("/notes/create", { replace: true, addNonce: true }),
      }}
    />
  );
}
export default React.memo(Home, () => true);
