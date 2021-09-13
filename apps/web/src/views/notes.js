import { useEffect } from "react";
import ListContainer from "../components/list-container";
import { useStore as useNotesStore } from "../stores/note-store";
import NotesPlaceholder from "../components/placeholders/notesplacholder";
import { hashNavigate, navigate } from "../navigation";
import FavoritesPlaceholder from "../components/placeholders/favorites-placeholder";
import { groupArray } from "notes-core/utils/grouping";
import { db } from "../common/db";

function Notes() {
  const context = useNotesStore((store) => store.context);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const type = context?.type === "favorite" ? "favorites" : "notes";

  useEffect(() => {
    if (context?.type === "color" && context?.notes?.length <= 0) {
      navigate("/", true);
    }
  }, [context]);

  if (!context) return null;
  return (
    <ListContainer
      type="notes"
      groupType={type}
      refresh={refreshContext}
      context={{ ...context, notes: undefined }}
      items={groupArray(context.notes, db.settings.getGroupOptions(type))}
      placeholder={
        context.type === "favorite" ? FavoritesPlaceholder : NotesPlaceholder
      }
      button={{
        content: "Make a new note",
        onClick: () =>
          hashNavigate("/notes/create", { addNonce: true, replace: true }),
      }}
    />
  );
}
export default Notes;
