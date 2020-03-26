import React from "react";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { useStore } from "../../stores/searchstore";
import "./search.css";
import RootNavigator from "../../navigation/navigators/rootnavigator";

var query = "";
function Search(props) {
  const search = useStore(store => store.search);
  return (
    <Flex
      px={2}
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      sx={{
        position: "relative",
        marginBottom: 0
      }}
    >
      <Input
        id="searchInput"
        variant="default"
        name="search"
        autoFocus={!!query}
        defaultValue={query}
        placeholder={`Search your ${props.type}`}
        onChange={e => {
          query = e.target.value;
          if (query.length >= 1) {
            search(query);
            RootNavigator.navigate("search");
          } else {
            RootNavigator.goBack();
          }
        }}
      />
      <Box
        id="searchIcon"
        sx={{
          position: "absolute",
          right: 0,
          marginRight: 20,
          color: "hover",
          height: 24
        }}
      >
        <Icon.Search size={28} />
      </Box>
    </Flex>
  );
}
export default Search;
