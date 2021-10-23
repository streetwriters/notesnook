import React from "react";
import Notebook from "../../assets/notebook.svg";
import Placeholder from "./index";
import * as Icon from "../icons";
import { hashNavigate } from "../../navigation";

function TopicsPlaceholder() {
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
