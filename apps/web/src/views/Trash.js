import React from "react";
import { db, ev } from "../common";
import * as Icon from "react-feather";
import ListView from "../components/listview";
import { ask } from "../components/dialogs";
import { showSnack } from "../components/snackbar";

const dropdownRefs = [];
const menuItems = item => [
  {
    title: "Restore",
    onClick: async () => {
      ask(
        Icon.Star,
        "Restore",
        `Are you sure you want to restore this item to ${item.type}?`
      ).then(res => {
        if (res) {
          let itemType = item.type[0] + item.type.substring(1);
          showSnack(itemType + " Restored", Icon.Check);
          db.restoreItem(item.dateCreated);
          ev.emit(`refreshTrash`);
        }
      });
    }
  },
  {
    title: "Delete",
    color: "red",
    onClick: async () => {
      ask(
        Icon.Star,
        "Delete",
        `Are you sure you want to permanently delete this item?`
      ).then(res => {
        if (res) {
          let itemType = item.type[0] + item.type.substring(1);
          showSnack(itemType + "Permanently Deleted!", Icon.Trash2);
          //place permanent delete here
          ev.emit(`refreshTrash`);
        }
      });
    }
  }
];

function Trash() {
  return (
    <ListView
      type="Trash"
      getItems={db.getTrash.bind(db)}
      menu={{ menuItems, dropdownRefs }}
      button={{
        content: "Clear Trash",
        icon: Icon.Trash2,
        onClick: () => db.clearTrash()
      }}
    />
  );
}

export default Trash;
