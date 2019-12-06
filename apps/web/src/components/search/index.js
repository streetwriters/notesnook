import React from "react";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "react-feather";
import theme from "../../theme";
import "./search.css";
const Search = props => (
  <Flex
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
      placeholder={props.placeholder}
      my={2}
    />
    <Box
      id="searchIcon"
      sx={{
        position: "absolute",
        right: 0,
        marginRight: 10,
        color: theme.colors["hover"],
        height: 24
      }}
    >
      <Icon.Search />
    </Box>
  </Flex>
);
export default Search;
