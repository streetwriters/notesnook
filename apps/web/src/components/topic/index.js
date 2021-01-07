import React from "react";
import ListItem from "../list-item";
import { confirm } from "../dialogs/confirm";
import * as Icon from "../icons";
import { db } from "../../common";
import { store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { Text } from "rebass";
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
    onClick: () => {
      confirm(Icon.Trash, {
        title: "Delete topic",
        subtitle: "Are you sure you want to delete this topic?",
        yesText: "Delete topic",
        noText: "Cancel",
        message: (
          <>
            This action is{" "}
            <Text as="span" color="error">
              IRREVERSIBLE
            </Text>
            . Deleting this topic{" "}
            <Text as="span" color="primary">
              will not delete the notes contained in it.
            </Text>
          </>
        ),
      }).then(async (res) => {
        if (res) {
          await db.notebooks.notebook(item.notebookId).topics.delete(item.id);
          store.setSelectedNotebookTopics(item.notebookId);
        }
      });
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
export default Topic;
