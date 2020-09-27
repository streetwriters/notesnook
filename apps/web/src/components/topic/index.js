import React from "react";
import ListItem from "../list-item";
import { showEditTopicDialog } from "../dialogs/topicdialog";
import { confirm } from "../dialogs/confirm";
import * as Icon from "../icons";
import { db } from "../../common";
import { store } from "../../stores/notebook-store";
import { Text } from "rebass";

const menuItems = (item) => [
  {
    title: "Edit",
    onClick: () => {
      showEditTopicDialog(item);
    },
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
      menuData={topic}
      menuItems={menuItems(topic)}
    />
  );
}
export default Topic;
