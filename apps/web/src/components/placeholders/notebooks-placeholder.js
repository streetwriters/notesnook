import React from "react";
import Placeholder from "./index";
import { Plus } from "../icons";
import { hashNavigate } from "../../navigation";

function NotebooksPlaceholder() {
  return (
    <Placeholder
      id="notebook"
      title="Your notebooks"
      text="You have not made any notebooks yet."
      callToAction={{
        text: "Make your first notebook",
        icon: Plus,
        onClick: () => hashNavigate("/notebooks/create")
      }}
    />
  );
}
export default NotebooksPlaceholder;
