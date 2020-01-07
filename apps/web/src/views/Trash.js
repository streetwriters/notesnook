import React from "react";
import { db } from "../common";
import * as Icon from "react-feather";
import ListView from "../components/listview";

const dropdownRefs = [];
const menuItems = [
  { title: "Restore" },
  {
    title: "Delete",
    color: "red"
  }
];

function Trash() {
  return (
    <ListView
      type="Trash"
      getItems={db.getTrash.bind(db)}
      menu={{ menuItems, dropdownRefs }}
      button={{
        callToAction: "Clear Trash",
        icon: Icon.Trash2,
        onClick: () => db.clearTrash()
      }}
    />
  );
}

export default Trash;
