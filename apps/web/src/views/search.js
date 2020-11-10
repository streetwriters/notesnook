import React, { useState } from "react";
import ListContainer from "../components/list-container";
import SearchPlaceholder from "../components/placeholders/search-placeholder";
import { useQueryParams } from "hookrouter";
import { db, notesFromContext } from "../common";
import SearchBox from "../components/search";
import { useStore as useNoteStore } from "../stores/note-store";

function typeToItems(type, context) {
  switch (type) {
    case "notes":
      if (!context) return ["notes", db.notes.all];
      const notes = notesFromContext(context);
      return ["notes", notes];
    case "notebooks":
      return ["notebooks", db.notebooks.all];
    case "topics":
      const { notebookId } = context;
      if (!notebookId) return ["topics", []];
      const topics = db.notebooks.notebook(notebookId).topics.all;
      return ["topics", topics];
    case "trash":
      return ["trash", db.trash.all];
    default:
      return [];
  }
}

function Search() {
  const [results, setResults] = useState([]);
  const [params] = useQueryParams();
  const { type } = params;
  const context = useNoteStore((store) => store.context);

  return (
    <>
      <SearchBox
        onSearch={(query) => {
          const [lookupType, items] = typeToItems(type, context);
          setResults(db.lookup[lookupType](items, query));
        }}
      />
      <ListContainer
        context={context}
        type={type}
        items={results}
        placeholder={SearchPlaceholder}
      />
    </>
  );
}
export default Search;
