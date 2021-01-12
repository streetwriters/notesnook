import React from "react";
import { ReactComponent as Trash } from "../../assets/trash.svg";
import Placeholder from "./index";

function TrashPlaceholder() {
  return (
    <Placeholder
      image={Trash}
      title="Your trash"
      text="All items here are permanently deleted after 7 days."
    />
  );
}
export default TrashPlaceholder;
