import React from "react";
import { Flex, Text } from "rebass";
import ListItem from "../list-item";
import { store } from "../../stores/notebook-store";
import { showEditNoteDialog } from "../dialogs/addnotebookdialog";

function menuItems(notebook, index) {
  return [
    {
      title: notebook.pinned ? "Unpin" : "Pin",
      onClick: () => store.pin(notebook, index),
    },
    {
      title: "Edit",
      onClick: () => showEditNoteDialog(notebook),
    },
    {
      title: "Delete",
      color: "red",
      onClick: () => store.delete(notebook.id, index),
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
                onClick={(e) => {
                  onTopicClick(notebook, topic);
                  e.stopPropagation();
                }}
                key={topic.title}
                bg="primary"
                px={1}
                sx={{
                  marginRight: 1,
                  borderRadius: "default",
                  color: "static",
                  paddingTop: 0.4,
                  paddingBottom: 0.4,
                }}
              >
                <Text variant="body" fontSize={11}>
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
