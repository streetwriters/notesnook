import React from "react";
import { ReactComponent as Search } from "../../assets/search.svg";
import Placeholder from "./index";

function SearchPlaceholder() {
  return <Placeholder image={Search} text="Nothing to show." />;
}
export default SearchPlaceholder;
