import React from "react";
import ListItem from "../list-item";
import { db } from "../../common/db";
import { store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import { Text } from "rebass";

function Topic({ item, index, onClick }) {
  const topic = item;
  return (
    <ListItem
      selectable
      item={topic}
      onClick={onClick}
      title={topic.title}
      footer={
        <Text mt={1} variant="subBody">
          {topic.notes.length} Notes
        </Text>
      }
      index={index}
      menu={{
        items: topic.title === "General" ? generalTopicMenuItems : menuItems,
        extraData: { topic },
      }}
    />
  );
}

export default React.memo(Topic, (prev, next) => {
  return (
    prev?.item?.title === next?.item?.title &&
    prev?.item?.notes.length === next?.item?.notes.length
  );
});

const generalTopicMenuItems = [
  {
    key: "shortcut",
    title: ({ topic }) =>
      db.settings.isPinned(topic.id) ? "Remove shortcut" : "Create shortcut",
    onClick: ({ topic }) => appStore.pinItemToMenu(topic),
  },
];

const menuItems = [
  {
    key: "edit",
    title: () => "Edit",
    onClick: ({ topic }) =>
      hashNavigate(`/notebooks/${topic.notebookId}/topics/${topic.id}/edit`),
  },
  ...generalTopicMenuItems,
  {
    key: "delete",
    title: () => "Delete",
    color: "red",
    onClick: async ({ topic }) => {
      await db.notebooks.notebook(topic.notebookId).topics.delete(topic.id);
      store.setSelectedNotebook(topic.notebookId);
    },
  },
];
