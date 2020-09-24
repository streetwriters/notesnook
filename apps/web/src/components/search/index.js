import React from "react";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import "./search.css";
import { navigate } from "hookrouter";

function Search(props) {
  const { query, type, context } = props;

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
        placeholder={`Type your query here`}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            let query = e.target.value;
            navigate(
              `/search`,
              false,
              { q: query, type, context: btoa(JSON.stringify(context)) },
              true
            );
          }
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
