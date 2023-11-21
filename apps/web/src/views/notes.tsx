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

import { useEffect } from "react";
import ListContainer from "../components/list-container";
import { useStore as useNotesStore } from "../stores/note-store";
import { hashNavigate, navigate } from "../navigation";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";

function Notes() {
  const context = useNotesStore((store) => store.context);
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const type = context?.type === "favorite" ? "favorites" : "notes";
  const isCompact = useNotesStore((store) => store.viewMode === "compact");
  const filteredItems = useSearch(
    "notes",
    (query) => {
      if (!context || !contextNotes) return;
      return db.lookup.notes(query, contextNotes.ungrouped).sorted();
    },
    [context, contextNotes]
  );

  useEffect(() => {
    if (
      context?.type === "color" &&
      contextNotes &&
      contextNotes.ids.length <= 0
    ) {
      navigate("/", { replace: true });
    }
  }, [context, contextNotes]);

  if (!context || !contextNotes) return <Placeholder context="notes" />;
  return (
    <ListContainer
      group={type}
      refresh={refreshContext}
      compact={isCompact}
      context={context}
      items={filteredItems || contextNotes}
      placeholder={
        <Placeholder
          context={
            context.type === "favorite"
              ? "favorites"
              : context.type === "monographs"
              ? "monographs"
              : "notes"
          }
        />
      }
      button={{
        onClick: () =>
          hashNavigate("/notes/create", { addNonce: true, replace: true })
      }}
    />
  );
}
export default Notes;
