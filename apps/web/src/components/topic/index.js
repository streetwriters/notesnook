import React from "react";
import ListItem from "../list-item";
import { db } from "../../common/db";
import { store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";

function Topic({ item, index, onClick }) {
  const topic = item;
  return (
    <ListItem
      selectable
      item={topic}
      onClick={onClick}
      title={topic.title}
      footer={
        <Flex
          sx={{ fontSize: "subBody", color: "fontTertiary" }}
          alignItems="center"
        >
          <Text variant="subBody" color="primary">
            Topic
          </Text>
          <Text as="span" mx={1}>
            •
          </Text>
          <Text variant="subBody">{topic.notes.length} Notes</Text>
        </Flex>
      }
      index={index}
      menu={{
        items: menuItems,
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
    icon: Icon.Shortcut,
    onClick: ({ topic }) => appStore.pinItemToMenu(topic),
  },
];

const menuItems = [
  {
    key: "edit",
    title: () => "Edit",
    icon: Icon.Edit,
    onClick: ({ topic }) =>
      hashNavigate(`/notebooks/${topic.notebookId}/topics/${topic.id}/edit`),
  },
  ...generalTopicMenuItems,
  {
    key: "delete",
    title: () => "Delete",
    icon: Icon.Trash,
    color: "red",
    onClick: async ({ topic }) => {
      await db.notebooks.notebook(topic.notebookId).topics.delete(topic.id);
      store.setSelectedNotebook(topic.notebookId);
    },
  },
];
