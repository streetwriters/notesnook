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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ListContainer from "../components/list-container";
import SearchPlaceholder from "../components/placeholders/search-placeholder";
import { db } from "../common/db";
import SearchBox from "../components/search";
import ProgressBar from "../components/progress-bar";
import { useStore as useNoteStore } from "../stores/note-store";
import { Flex, Text } from "@theme-ui/components";
import { showToast } from "../utils/toast";
import { store as notebookstore } from "../stores/notebook-store";
import { hardNavigate } from "../navigation";

async function typeToItems(type, context) {
  switch (type) {
    case "notes": {
      await db.notes.init();
      if (!context) return ["notes", db.notes.all];
      const notes = context.notes;
      return ["notes", notes];
    }
    case "notebooks":
      return ["notebooks", db.notebooks.all];
    case "topics": {
      const notebookId = notebookstore.get().selectedNotebookId;
      if (!notebookId) return ["topics", []];
      const topics = db.notebooks.notebook(notebookId).topics.all;
      return ["topics", topics];
    }
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
    totalItems: 0
  });
  const [results, setResults] = useState([]);
  const context = useNoteStore((store) => store.context);
  const nonce = useNoteStore((store) => store.nonce);
  const setSearch = useNoteStore((store) => store.setSearch);
  const cachedQuery = useRef();

  const onSearch = useCallback(
    async (query) => {
      if (!query) return;
      cachedQuery.current = query;
      setSearch(query);

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
    },
    [context, type, setSearch]
  );

  const title = useMemo(() => {
    switch (type) {
      case "notes":
        if (!context) return "all notes";
        switch (context.type) {
          case "topic": {
            const notebook = db.notebooks.notebook(context.value.id);
            const topic = notebook.topics.topic(context.value.topic);
            return `notes of ${topic._topic.title} in ${notebook.title}`;
          }
          case "tag": {
            const tag = db.tags.all.find((tag) => tag.id === context.value);
            return `notes in #${tag.title}`;
          }
          case "favorite":
            return "favorite notes";
          case "color": {
            const color = db.colors.all.find((tag) => tag.id === context.value);
            return `notes in color ${color.title}`;
          }
          default:
            return;
        }
      case "notebooks":
        return "all notebooks";
      case "topics": {
        const notebookId = notebookstore.get().selectedNotebookId;
        if (!notebookId) return "";
        const notebook = db.notebooks.notebook(notebookId);
        return `topics in ${notebook.title} notebook`;
      }
      case "tags":
        return "all tags";
      case "trash":
        return "all trash";
      default:
        return "";
    }
  }, [type, context]);

  useEffect(() => {
    (async function () {
      const [lookupType, items] = await typeToItems(type, context);
      const results = await db.lookup[lookupType](items, cachedQuery.current);
      setResults(results);
    })();
  }, [nonce, type, context]);

  if (!title) return hardNavigate("/");

  return (
    <>
      <Text variant="subtitle" mx={2}>
        Searching {title}
      </Text>
      <SearchBox onSearch={onSearch} />
      {searchState.isSearching ? (
        <Flex
          sx={{
            flex: "1",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <SearchPlaceholder
            text={`Searching in ${searchState.totalItems} ${type}...`}
          />
          <ProgressBar
            progress={100}
            width={"60%"}
            duration={3}
            sx={{ mt: 2 }}
          />
        </Flex>
      ) : (
        <ListContainer
          context={{ type: "search" }}
          type={type}
          items={results}
          placeholder={() => (
            <SearchPlaceholder
              text={
                cachedQuery.current
                  ? `Nothing found for "${cachedQuery.current}"`
                  : undefined
              }
            />
          )}
        />
      )}
    </>
  );
}
export default Search;
