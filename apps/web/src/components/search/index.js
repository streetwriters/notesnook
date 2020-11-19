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
      mx={2}
      mb={2}
      px={2}
      bg="bgSecondary"
      sx={{
        position: "relative",
        borderRadius: "default",
      }}
    >
      <Input
        id="searchInput"
        name="search"
        sx={{ borderWidth: 0, px: 0 }}
        placeholder={`Type your query here`}
        onKeyDown={(e) => {
          if (e.key === "Enter") props.onSearch(e.target.value);
        }}
      />
      <Box
        id="searchIcon"
        sx={{
          color: "hover",
        }}
      >
        <Icon.Search size={24} />
      </Box>
    </Flex>
  );
}
export default SearchBox;
