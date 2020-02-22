import React from "react";
import { db, ev } from "../common";
import * as Icon from "react-feather";
import ListView from "../components/listview";
import { confirm } from "../components/dialogs/confirm";
import { showSnack } from "../components/snackbar";

const dropdownRefs = [];
const menuItems = item => [
  {
    title: "Restore",
    onClick: async () => {
      confirm(
        Icon.Star,
        "Restore",
        `Are you sure you want to restore this item to ${item.type}?`
      ).then(async res => {
        if (res) {
          let itemType = item.type[0] + item.type.substring(1);
          showSnack(itemType + " Restored", Icon.Check);
          await db.trash.restore(item.id);
          ev.emit(`refreshTrash`);
        }
      });
    }
  },
  {
    title: "Delete",
    color: "red",
    onClick: async () => {
      confirm(
        Icon.Star,
        "Delete",
        `Are you sure you want to permanently delete this item?`
      ).then(async res => {
        if (res) {
          let itemType = item.type[0] + item.type.substring(1);
          showSnack(itemType + "Permanently Deleted!", Icon.Trash2);
          await db.trash.delete(item.id);
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
      getItems={db.trash.all}
      menu={{ menuItems, dropdownRefs }}
      button={{
        content: "Clear Trash",
        icon: Icon.Trash2,
        onClick: async () => await db.trash.clear()
      }}
      onClick={item => {}}
    />
  );
}

export default Trash;
