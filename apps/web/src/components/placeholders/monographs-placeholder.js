import React from "react";
import Monographs from "../../assets/monographs.svg";
import Placeholder from "./index";

function MonographsPlaceholder() {
  return (
    <Placeholder
      image={Monographs}
      title="Your monographs"
      text="All your published notes will be shown here."
    />
  );
}
export default MonographsPlaceholder;
