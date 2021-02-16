import React, { useState } from "react";
import ListContainer from "../components/list-container";
import SearchPlaceholder from "../components/placeholders/search-placeholder";
import { notesFromContext } from "../common";
import { db } from "../common/db";
import SearchBox from "../components/search";
import ProgressBar from "../components/progress-bar";
import { useStore as useNoteStore } from "../stores/note-store";
import { Flex, Text } from "rebass";
import { showToast } from "../utils/toast";

async function typeToItems(type, context) {
  switch (type) {
    case "notes":
      await db.notes.init();
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
    case "tags":
      return ["tags", db.tags.all];
    case "trash":
      return ["trash", db.trash.all];
    default:
      return [];
  }
}

function Search({ type }) {
  const [searchState, setSearchState] = useState({
    isSearching: false,
    totalItems: 0,
  });
  const [results, setResults] = useState([]);
  const context = useNoteStore((store) => store.context);

  return (
    <>
      <SearchBox
        onSearch={async (query) => {
          const [lookupType, items] = await typeToItems(type, context);
          setResults([]);

          if (items.length <= 0) {
            showToast("error", `There are no items to search in.`);
            return;
          }

          setSearchState({ isSearching: true, totalItems: items.length });
          const results = await db.lookup[lookupType](items, query);
          setResults(results);
          setSearchState({ isSearching: false, totalItems: 0 });
          if (!results.length) {
            showToast("error", `Nothing found for "${query}".`);
          }
        }}
      />
      {searchState.isSearching ? (
        <Flex
          flex="1"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <SearchPlaceholder />
          <Text mt={2}>
            Searching in {searchState.totalItems} {type}...
          </Text>
          <ProgressBar
            progress={100}
            width={"60%"}
            duration={3}
            sx={{ mt: 2 }}
          />
        </Flex>
      ) : (
        <ListContainer
          context={context}
          type={type}
          items={results}
          placeholder={SearchPlaceholder}
        />
      )}
    </>
  );
}
export default Search;
