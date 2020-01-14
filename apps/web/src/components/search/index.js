import React from "react";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "react-feather";
import "./search.css";
const Search = props => (
  <Flex
    px={3}
    flexDirection="row"
    justifyContent="center"
    alignItems="center"
    sx={{
      position: "relative"
    }}
  >
    <Input
      id="searchInput"
      variant="search"
      name="search"
      placeholder={props.placeholder}
      onChange={props.onChange}
      my={2}
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
      <Icon.Search />
    </Box>
  </Flex>
);
export default Search;
