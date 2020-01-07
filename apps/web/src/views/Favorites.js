import React from "react";
import { db } from "../common";
import ListItem from "../components/listview";

const dropdownRefs = [];
const menuItems = [
  { title: "Unfavorite" },
  {
    title: "Delete",
    color: "red"
  }
];

function Favorites() {
  return (
    <ListItem
      type="Favorites"
      getItems={db.getFavorites}
      menu={{ menuItems, dropdownRefs }}
      button={undefined}
    />
  );
}

export default Favorites;
