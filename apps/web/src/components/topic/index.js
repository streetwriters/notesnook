import React from "react";
import ListItem from "../list-item";
import { db } from "../../common/db";
import { store as appStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import { Multiselect } from "../../common/multi-select";
import { pluralize } from "../../utils/string";

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
          <Text variant="subBody">
            {pluralize(topic.notes?.length || 0, "note", "notes")}
          </Text>
        </Flex>
      }
      index={index}
      menu={{
        items: menuItems,
        extraData: { topic, notebookId: topic.notebookId }
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

const menuItems = [
  {
    key: "edit",
    title: "Edit",
    icon: Icon.Edit,
    onClick: ({ topic }) =>
      hashNavigate(`/notebooks/${topic.notebookId}/topics/${topic.id}/edit`)
  },
  {
    key: "shortcut",
    title: ({ topic }) =>
      db.settings.isPinned(topic.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ topic }) => appStore.pinItemToMenu(topic)
  },
  {
    key: "delete",
    title: "Delete",
    icon: Icon.Trash,
    color: "error",
    iconColor: "error",
    onClick: async ({ items, notebookId }) => {
      await Multiselect.deleteTopics(notebookId, items);
    },
    multiSelect: true
  }
];
