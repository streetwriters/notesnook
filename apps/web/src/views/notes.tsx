/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import ListContainer from "../components/list-container";
import {
  notesFromContext,
  useStore as useNotesStore
} from "../stores/note-store";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { handleDrop } from "../common/drop-handler";
import { useEditorStore } from "../stores/editor-store";
import { ListLoader } from "../components/loaders/list-loader";
import Search from "./search";

type NotesProps = { header?: JSX.Element };
function Notes(props: NotesProps) {
  const { header } = props;
  const context = useNotesStore((store) => store.context);
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const type =
    context?.type === "favorite"
      ? "favorites"
      : context?.type === "archive"
      ? "archive"
      : "notes";
  const isCompact = useNotesStore((store) => store.viewMode === "compact");
  const filteredItems = useSearch(
    context?.type === "notebook" ? "notebook" : "notes",
    async (query, sortOptions) => {
      if (!context || !contextNotes) return;
      const notes = notesFromContext(context);
      return await db.lookup.notes(query, sortOptions, notes);
    },
    [context, contextNotes]
  );

  if (filteredItems)
    return <Search items={filteredItems} refresh={refreshContext} />;

  if (!context || !contextNotes) return <ListLoader />;
  return (
    <ListContainer
      type={type}
      group={type}
      refresh={refreshContext}
      compact={isCompact}
      context={context}
      items={contextNotes}
      onDrop={(e) => handleDrop(e.dataTransfer, context)}
      placeholder={
        <Placeholder
          context={
            filteredItems
              ? "search"
              : context.type === "favorite"
              ? "favorites"
              : context.type === "archive"
              ? "archive"
              : context.type === "monographs"
              ? "monographs"
              : "notes"
          }
        />
      }
      button={{
        onClick: () => useEditorStore.getState().newSession()
      }}
      header={header}
    />
  );
}
export default Notes;
