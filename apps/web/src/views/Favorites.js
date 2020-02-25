import React, { useEffect } from "react";
import ListView from "../components/listview";
import { useStore, store, LIST_TYPES } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";
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
  const openSession = useEditorStore(store => store.openSession);
  return (
    <ListView
      type="Favorites"
      items={items}
      menu={{ menuItems, dropdownRefs }}
      noType
      button={undefined}
      onClick={async item => {
        await openSession(item);
      }}
    />
  );
}

export default Favorites;
