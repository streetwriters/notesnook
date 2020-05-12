import React from "react";
import ListContainer from "../components/list-container";
import SearchInput from "../components/search";
import { useStore } from "../stores/searchstore";
import SearchPlaceholder from "../components/placeholders/search-placeholder";

function Search() {
  const results = useStore((store) => store.results);
  const item = useStore((store) => store.item);
  return (
    <>
      <SearchInput type={""} />
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
