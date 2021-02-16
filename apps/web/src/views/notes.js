import React from "react";
import ListContainer from "../components/list-container";
import { useStore as useNotesStore } from "../stores/note-store";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { hashNavigate } from "../navigation";
import FavoritesPlaceholder from "../components/placeholders/favorites-placeholder";

function Notes() {
  const context = useNotesStore((store) => store.context);
  if (!context) return null;
  return (
    <ListContainer
      type="notes"
      context={{ ...context, notes: undefined }}
      items={context.notes}
      placeholder={
        context.type === "favorites" ? FavoritesPlaceholder : NotesPlaceholder
      }
      button={{
        content: "Make a new note",
        onClick: () => hashNavigate("/notes/create", true),
      }}
    />
  );
}
export default Notes;
