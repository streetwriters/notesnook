import React from "react";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import "./search.css";

function SearchBox(props) {
  //const { query, type, context } = props;

  return (
    <Flex
      variant="rowCenter"
      px={2}
      mb={2}
      sx={{
        position: "relative",
      }}
    >
      <Input
        id="searchInput"
        name="search"
        bg="border"
        placeholder={`Type your query here`}
        onKeyDown={(e) => {
          if (e.key === "Enter") props.onSearch(e.target.value);
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
export default SearchBox;
