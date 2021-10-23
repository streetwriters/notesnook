import React from "react";
import Tag from "../../assets/tag.svg";
import Placeholder from "./index";

function TagsPlaceholder() {
  return (
    <Placeholder
      image={Tag}
      title="Your tags"
      text="You have not tagged any notes yet."
    />
  );
}
export default TagsPlaceholder;
