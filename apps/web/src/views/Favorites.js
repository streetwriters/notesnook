import React from "react";
import { db, ev } from "../common";
import * as Icon from "react-feather";
import ListView from "../components/listview";
import { showSnack } from "../components/snackbar";
import { confirm } from "../components/dialogs/confirm";
const dropdownRefs = [];
const menuItems = item => [
  {
    title: "Unfavorite",
    onClick: async () => {
      confirm(
        Icon.Star,
        "Unfavorite",
        "Are you sure you want to remove this item from favorites?"
      ).then(res => {
        if (res) {
          (item.type === "notes"
            ? db.notes.note(item.id)
            : db.notebooks.notebook(item.id)
          )
            .favorite()
            .then(() => {
              let itemType = item.type[0] + item.type.substring(1);
              showSnack(itemType + " Unfavorited!", Icon.Check);
              ev.emit(`refreshFavorites`);
            });
        }
      });
    }
  },
  {
    title: "Delete",
    color: "red",
    onClick: async () => {
      confirm(
        Icon.Trash2,
        "Delete",
        "Are you sure you want to delete this note? It will be moved to trash and permanently deleted after 7 days."
      ).then(res => {
        if (res) {
          let itemType = item.type[0] + item.type.substring(1);
          (itemType === "notes" ? db.notes : db.notebooks)
            .delete(item.id)
            .then(() => {
              showSnack(itemType + " Deleted!", Icon.Trash);
              ev.emit(`refreshFavorites`);
            });
        }
      });
    }
  }
];

function Favorites() {
  return (
    <ListView
      type="Favorites"
      getItems={db.notes.favorites}
      menu={{ menuItems, dropdownRefs }}
      button={undefined}
      onClick={item => {
        if (item.type === "note") {
          sendOpenNoteEvent(item);
        }
      }}
    />
  );
}

function sendOpenNoteEvent(note) {
  ev.emit("onOpenNote", note);
}

export default Favorites;
