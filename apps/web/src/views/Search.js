import React, { useEffect, useState } from "react";
import { Flex } from "rebass";
import ListContainer from "../components/list-container";
import SearchInput from "../components/search";
import RootNavigator from "../navigation/navigators/rootnavigator";
import { db } from "../common";

function Search(props) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const items = db.lookup[props.type](props.items, props.term);
    setItems(items);
  }, [props]);
  return (
    <>
      <SearchInput
        autoFocus
        placeholder={"Search here"}
        defaultValue={props.term}
        onChange={e => {
          if (e.target.value.length > 2) {
            const items = db.lookup[props.type](props.items, e.target.value);
            setItems(items);
          } else {
            RootNavigator.goBack({ term: e.target.value });
          }
        }}
      />
      <ListContainer
        noSearch={true}
        itemsLength={items.length}
        item={index => props.item(index, items[index])}
      />
    </>
  );
}
export default Search;
