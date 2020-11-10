import React from "react";
import { Flex, Text } from "rebass";
import ListItem from "../list-item";
import { store } from "../../stores/notebook-store";
import { showEditNotebookDialog } from "../dialogs/addnotebookdialog";
import { showDeleteConfirmation } from "../dialogs/confirm";
import { showItemDeletedToast, showUnpinnedToast } from "../../common/toasts";
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
      title: "Edit",
      onClick: async () => {
        if (await showEditNotebookDialog(notebook)) store.refresh();
      },
    },
    {
      title: "Delete",
      color: "red",
      onClick: () => {
        showDeleteConfirmation("notebook").then(async (res) => {
          if (res) {
            await store
              .delete(notebook.id, index)
              .then(() => showItemDeletedToast(notebook));
          }
        });
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
        unpin={() => pin(notebook, index)}
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
            {new Date(notebook.dateCreated).toDateString().substring(4)}
            <Text as="span" mx={1}>
              •
            </Text>
            <Text>{notebook.totalNotes} Notes</Text>
          </Flex>
        }
        pinned={notebook.pinned}
        index={index}
        menuData={notebook}
        menuItems={menuItems(notebook, index)}
      />
    );
  }
}
export default Notebook;
