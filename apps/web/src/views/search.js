import React from "react";
import ListContainer from "../components/list-container";
import SearchInput from "../components/search";
import { useStore } from "../stores/searchstore";
import SearchPlaceholder from "../components/placeholders/search-placeholder";

window.addEventListener("load", () => {
  const path = window.location.pathname;
  if (path === "/search") window.location = "/";
});

function Search() {
  const results = useStore((store) => store.results);
  const item = useStore((store) => store.item);
  const type = useStore((store) => store.type);

  return (
    <>
      <SearchInput type={type} />
      <ListContainer
        noSearch
        items={results}
        placeholder={SearchPlaceholder}
        item={item}
      />
    </>
  );
}
export default Search;
