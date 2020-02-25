import React, { useEffect } from "react";
import * as Icon from "react-feather";
import ListView from "../components/listview";
import { confirm } from "../components/dialogs/confirm";
import { useStore, store } from "../stores/trash-store";

const dropdownRefs = [];
const menuItems = (item, index) => [
  {
    title: "Restore",
    onClick: () => store.getState().restore(item.id, index)
  },
  {
    title: "Delete",
    color: "red",
    onClick: () => {
      confirm(
        Icon.Trash2,
        "Delete",
        `Are you sure you want to permanently delete this item?`
      ).then(async res => {
        if (res) {
          await store.getState().delete(item.id, index);
        }
      });
    }
  }
];

function Trash() {
  useEffect(() => store.getState().refresh(), []);
  const items = useStore(store => store.trash);
  const clearTrash = useStore(store => store.clear);
  return (
    <ListView
      type="Trash"
      items={items}
      menu={{ menuItems, dropdownRefs }}
      button={{
        content: "Clear Trash",
        icon: Icon.Trash2,
        onClick: function() {
          confirm(
            Icon.Trash2,
            "Clear",
            `This action is irreversible. Are you sure you want to proceed?s`
          ).then(async res => {
            if (res) {
              await clearTrash();
            }
          });
        }
      }}
    />
  );
}

export default Trash;
