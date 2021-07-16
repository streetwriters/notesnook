import React, { useState } from "react";
import { db } from "../common/db";
import ListContainer from "../components/list-container";
import MonographsPlaceholder from "../components/placeholders/monographsplaceholder";
import useNavigate from "../utils/use-navigate";

function Monographs() {
  const [monographs, setMonographs] = useState([]);
  useNavigate("monographs", () => {
    setMonographs(db.monographs.all);
  });
  return (
    <ListContainer
      type="notes"
      groupType="notes"
      items={monographs}
      placeholder={MonographsPlaceholder}
    />
  );
}
export default Monographs;
