import React from "react";
import ListItem from "../list-item";
import { db } from "../../common";
import { store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";

const menuItems = (item) => [
  {
    title: db.settings.isPinned(item.id)
      ? "Remove shortcut"
      : "Create shortcut",
    onClick: () => appStore.pinItemToMenu(item),
  },
  {
    title: "Edit",
    onClick: () =>
      hashNavigate(`/notebooks/${item.notebookId}/topics/${item.id}/edit`),
    visible: item.title !== "General",
  },
  {
    title: "Delete",
    visible: item.title !== "General",
    color: "red",
    onClick: async () => {
      await db.notebooks.notebook(item.notebookId).topics.delete(item.id);
      store.setSelectedNotebook(item.notebookId);
    },
  },
];

function Topic({ item, index, onClick }) {
  const topic = item;
  return (
    <ListItem
      selectable
      item={topic}
      onClick={onClick}
      title={topic.title}
      info={`${topic.totalNotes} Notes`}
      index={index}
      menuItems={menuItems(topic)}
    />
  );
}
export default React.memo(Topic, (prev, next) => {
  return (
    prev?.item?.title === next?.item?.title &&
    prev?.item?.totalNotes === next?.item?.totalNotes
  );
});
