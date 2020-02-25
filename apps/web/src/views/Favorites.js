import React, { useEffect } from "react";
import { ev } from "../common";
import ListView from "../components/listview";
import { useStore, store, LIST_TYPES } from "../stores/note-store";
const dropdownRefs = [];
const menuItems = item => [
  {
    title: "Unfavorite",
    onClick: () => store.getState().favorite(item)
  }
];

function Favorites() {
  useEffect(() => store.getState().refreshList(LIST_TYPES.fav), []);
  const items = useStore(store => store.favorites);
  return (
    <ListView
      type="Favorites"
      items={items}
      menu={{ menuItems, dropdownRefs }}
      noType
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
