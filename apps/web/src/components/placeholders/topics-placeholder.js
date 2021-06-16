import React from "react";
import { ReactComponent as Notebook } from "../../assets/notebook.svg";
import Placeholder from "./index";
import * as Icon from "../icons";
import { hashNavigate } from "../../navigation";

function TopicsPlaceholder({ context: { notebookId } }) {
  return (
    <Placeholder
      image={Notebook}
      text="You have not added any topics yet."
      callToAction={{
        text: "Add a topic",
        icon: Icon.Plus,
        onClick: () => hashNavigate("/topics/create"),
      }}
    />
  );
}
export default TopicsPlaceholder;
