import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ListContainer from "../components/list-container";
import SearchPlaceholder from "../components/placeholders/search-placeholder";
import { db } from "../common/db";
import SearchBox from "../components/search";
import ProgressBar from "../components/progress-bar";
import { useStore as useNoteStore } from "../stores/note-store";
import { Flex, Text } from "rebass";
import { showToast } from "../utils/toast";
import { store as notebookstore } from "../stores/notebook-store";
import { hardNavigate, navigate } from "../navigation";

async function typeToItems(type, context) {
  switch (type) {
    case "notes":
      await db.notes.init();
      if (!context) return ["notes", db.notes.all];
      const notes = context.notes;
      return ["notes", notes];
    case "notebooks":
      return ["notebooks", db.notebooks.all];
    case "topics":
      const notebookId = notebookstore.get().selectedNotebookId;
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
  const nonce = useNoteStore((store) => store.nonce);
  const cachedQuery = useRef();

  const onSearch = useCallback(
    async (query) => {
      if (!query) return;
      cachedQuery.current = query;

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
    },
    [context, type]
  );

  const title = useMemo(() => {
    switch (type) {
      case "notes":
        if (!context) return "all notes";
        switch (context.type) {
          case "topic":
            const notebook = db.notebooks.notebook(context.value.id);
            const topic = notebook.topics.topic(context.value.topic);
            return `notes of ${topic._topic.title} in ${notebook.title}`;
          case "tag":
            const tag = db.tags.all.find((tag) => tag.id === context.value);
            return `notes in #${tag.title}`;
          case "favorite":
            return "favorite notes";
          case "color":
            const color = db.colors.all.find((tag) => tag.id === context.value);
            return `notes in color ${color.title}`;
          default:
            return;
        }
      case "notebooks":
        return "all notebooks";
      case "topics":
        const notebookId = notebookstore.get().selectedNotebookId;
        if (!notebookId) return "";
        const notebook = db.notebooks.notebook(notebookId);
        return `topics in ${notebook.title} notebook`;
      case "tags":
        return "all tags";
      case "trash":
        return "all trash";
      default:
        return "";
    }
  }, [type, context]);

  useEffect(() => {
    onSearch(cachedQuery.current);
  }, [nonce, onSearch]);

  if (!title) return hardNavigate("/");

  return (
    <>
      <Text variant="subtitle" mx={2}>
        Searching {title}
      </Text>
      <SearchBox onSearch={onSearch} />
      {searchState.isSearching ? (
        <Flex
          flex="1"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
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
