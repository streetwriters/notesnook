import React from "react";
import Notebook from "../../assets/notebook.svg";
import Placeholder from "./index";
import * as Icon from "../icons";
import { hashNavigate } from "../../navigation";

function NotebooksPlaceholder() {
  return (
    <Placeholder
      image={Notebook}
      title="Your notebooks"
      text="You have not made any notebooks yet."
      callToAction={{
        text: "Make your first notebook",
        icon: Icon.Plus,
        onClick: () => hashNavigate("/notebooks/create"),
      }}
    />
  );
}
export default NotebooksPlaceholder;
