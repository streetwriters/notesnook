import React, { useEffect, useMemo, useState } from "react";
import ListContainer from "../components/list-container";
import SearchPlaceholder from "../components/placeholders/search-placeholder";
import { useQueryParams } from "hookrouter";
import { db, notesFromContext } from "../common";

function typeToItems(type, context) {
  switch (type) {
    case "home":
      return ["notes", db.notes.all];
    case "notes":
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
  const { q: query, type, context: ctx } = params;
  const context = useMemo(() => {
    try {
      return ctx && JSON.parse(atob(ctx));
    } catch (e) {
      console.log(e);
    }
  }, [ctx]);

  useEffect(() => {
    const [lookupType, items] = typeToItems(type, context);
    if (lookupType === "notes") {
      db.lookup[lookupType](items, query).then((results) => {
        setResults(results);
      });
    } else {
      setResults(db.lookup[lookupType](items, query));
    }
  }, [context, query, type]);

  return (
    <>
      <ListContainer
        context={context}
        type={type}
        query={query}
        items={results}
        placeholder={SearchPlaceholder}
      />
    </>
  );
}
export default Search;
