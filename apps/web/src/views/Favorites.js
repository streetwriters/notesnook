import React from "react";
import { db, ev } from "../common";
import * as Icon from "react-feather";
import ListItem from "../components/listview";
import { showSnack } from "../components/snackbar";
const dropdownRefs = [];
const menuItems = item => [
  {
    title: "Unfavorite",
    onClick: async () =>
      db.favoriteItem(item.type, item.dateCreated).then(() => {
        let itemType = item.type[0] + item.type.substring(1);
        showSnack(itemType + " Unfavorited!", Icon.Check);
        ev.emit(`refreshFavorites`);
      })
  },
  {
    title: "Delete",
    color: "red",
    onClick: async () => {
      item.type == "note"
        ? db.deleteNotes([item])
        : db.deleteNotebooks([item]).then(() => {
            let itemType = item.type[0] + item.type.substring(1);
            showSnack(itemType + " Deleted!", Icon.Trash);
          });
    }
  }
];

function Favorites() {
  return (
    <ListItem
      type="Favorites"
      getItems={db.getFavorites.bind(db)}
      menu={{ menuItems, dropdownRefs }}
      button={undefined}
    />
  );
}

export default Favorites;
