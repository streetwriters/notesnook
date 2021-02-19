import React from "react";
import { Flex, Text } from "rebass";
import ListItem from "../list-item";
import { store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { showItemDeletedToast, showUnpinnedToast } from "../../common/toasts";
import { db } from "../../common/db";
import * as Icon from "../icons";
import { hashNavigate } from "../../navigation";

class Notebook extends React.Component {
  shouldComponentUpdate(nextProps) {
    const prevItem = this.props.item;
    const nextItem = nextProps.item;
    return (
      prevItem.pinned !== nextItem.pinned ||
      prevItem.favorite !== nextItem.favorite ||
      prevItem !== nextItem
    );
  }
  render() {
    const { item, index, onClick, onTopicClick } = this.props;
    const notebook = item;
    return (
      <ListItem
        selectable
        item={notebook}
        onClick={onClick}
        title={notebook.title}
        body={notebook.description}
        index={index}
        menu={{ items: menuItems, extraData: { notebook } }}
        footer={
          <>
            <Flex sx={{ marginBottom: 1, marginTop: 1 }}>
              {notebook?.topics?.slice(1, 4).map((topic) => (
                <Flex
                  key={topic.id}
                  onClick={(e) => {
                    onTopicClick(notebook, topic.id);
                    e.stopPropagation();
                  }}
                  bg="primary"
                  px={1}
                  sx={{
                    marginRight: 1,
                    borderRadius: "default",
                    color: "static",
                    paddingTop: "2px",
                    paddingBottom: "2px",
                  }}
                >
                  <Text variant="body" color="static" fontSize={11}>
                    {topic.title}
                  </Text>
                </Flex>
              ))}
            </Flex>
            <Flex sx={{ fontSize: "subBody", color: "fontTertiary" }}>
              {notebook.pinned && (
                <Icon.PinFilled color="primary" size={10} sx={{ mr: 1 }} />
              )}
              {new Date(notebook.dateCreated).toDateString().substring(4)}
              <Text as="span" mx={1}>
                •
              </Text>
              <Text>{notebook.totalNotes} Notes</Text>
            </Flex>
          </>
        }
      />
    );
  }
}
export default Notebook;

const pin = async (notebook) => {
  await store.pin(notebook);
  if (notebook.pinned) showUnpinnedToast(notebook.id, "notebook");
};

const menuItems = [
  {
    title: () => "Edit",
    onClick: ({ notebook }) => hashNavigate(`/notebooks/${notebook.id}/edit`),
  },
  {
    key: "pinnotebook",
    title: ({ notebook }) => (notebook.pinned ? "Unpin" : "Pin"),
    onClick: ({ notebook }) => pin(notebook),
  },
  {
    key: "shortcut",
    title: ({ notebook }) =>
      db.settings.isPinned(notebook.id) ? "Remove shortcut" : "Create shortcut",
    onClick: ({ notebook }) => appStore.pinItemToMenu(notebook),
  },
  {
    title: () => "Move to trash",
    color: "red",
    onClick: async ({ notebook }) => {
      await store
        .delete(notebook.id)
        .then(() => showItemDeletedToast(notebook));
    },
  },
];
