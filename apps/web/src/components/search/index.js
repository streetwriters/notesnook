import React from "react";
import * as Icon from "../icons";
import "./search.css";
import Field from "../field";

function SearchBox(props) {
  return (
    <Field
      autoFocus
      id="search"
      name="search"
      type="text"
      sx={{ mx: 2, mb: 2 }}
      placeholder="Type your query here"
      onKeyDown={(e) => {
        if (e.key === "Enter") props.onSearch(e.target.value);
      }}
      action={{
        icon: Icon.Search,
        onClick: () => {
          const searchField = document.getElementById("search");
          if (searchField && searchField.value && searchField.value.length) {
            props.onSearch(searchField.value);
          }
        }
      }}
    />
  );
}
export default SearchBox;
