import React from "react";
import ListContainer from "../components/list-container";
import SearchInput from "../components/search";
import { useStore } from "../stores/searchstore";

function Search(props) {
  const results = useStore(store => store.results);
  const item = useStore(store => store.item);
  return (
    <>
      <SearchInput type={""} />
      <ListContainer noSearch items={results} item={item} />
    </>
  );
}
export default Search;
