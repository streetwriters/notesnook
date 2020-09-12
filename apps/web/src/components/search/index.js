import React from "react";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import "./search.css";
import { navigate } from "hookrouter";
import { useStore } from "../../stores/searchstore";

var query;
function Search(props) {
  const search = useStore((store) => store.search);
  const { type } = props;

  return (
    <Flex
      variant="rowCenter"
      px={2}
      sx={{
        position: "relative",
      }}
    >
      <Input
        id="searchInput"
        name="search"
        autoFocus={!!query}
        defaultValue={query}
        placeholder={`Search your ${type}`}
        onChange={(e) => {
          query = e.target.value;
          if (query.length <= 0) return window.history.back();
          if (query.length === 1) {
            navigate("/search");
          }
          search(query);
        }}
      />
      <Box
        id="searchIcon"
        sx={{
          position: "absolute",
          right: 0,
          mr: 3,
          color: "hover",
        }}
      >
        <Icon.Search size={28} />
      </Box>
    </Flex>
  );
}
export default Search;
