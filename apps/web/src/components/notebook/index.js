import React from "react";
import { Flex, Text } from "rebass";
import ListItem from "../list-item";
import { store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { showItemDeletedToast, showUnpinnedToast } from "../../common/toasts";
import { db } from "../../common";
import * as Icon from "../icons";
import { hashNavigate } from "../../navigation";

const pin = async (notebook, index) => {
  await store.pin(notebook, index);
  if (notebook.pinned) showUnpinnedToast(notebook.id, "notebook");
};

function menuItems(notebook, index) {
  return [
    {
      title: notebook.pinned ? "Unpin" : "Pin",
      onClick: () => pin(notebook, index),
    },
    {
      title: db.settings.isPinned(notebook.id)
        ? "Remove shortcut"
        : "Create shortcut",
      onClick: () => appStore.pinItemToMenu(notebook),
    },
    {
      title: "Edit",
      onClick: () => hashNavigate(`/notebooks/${notebook.id}/edit`),
    },
    {
      title: "Move to trash",
      color: "red",
      onClick: async () => {
        await store
          .delete(notebook.id, index)
          .then(() => showItemDeletedToast(notebook));
      },
    },
  ];
}

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
        subBody={
          <Flex sx={{ marginBottom: 1, marginTop: 1 }}>
            {notebook.topics.slice(1, 4).map((topic) => (
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
        }
        info={
          <Flex variant="rowCenter">
            {notebook.pinned && (
              <Icon.PinFilled color="primary" size={10} sx={{ mr: 1 }} />
            )}
            {new Date(notebook.dateCreated).toDateString().substring(4)}
            <Text as="span" mx={1}>
              •
            </Text>
            <Text>{notebook.totalNotes} Notes</Text>
          </Flex>
        }
        pinned={notebook.pinned}
        index={index}
        menuItems={menuItems(notebook, index)}
      />
    );
  }
}
export default Notebook;
