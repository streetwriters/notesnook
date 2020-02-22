import React from "react";
import { Flex, Text } from "rebass";
import * as Icon from "react-feather";
import ListItem from "../list-item";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";

const dropdownRefs = [];
const menuItems = notebook => [
  {
    title: notebook.pinned ? "Unpin" : "Pin",
    onClick: async () =>
      db.notebooks
        .notebook(notebook.id)
        .pin()
        .then(() => {
          showSnack("Notebook pinned!", Icon.Check);
          ev.emit("refreshNotebooks");
        })
  },
  {
    title: notebook.favorite ? "Unfavorite" : "Favorite",
    onClick: async () =>
      db.notebooks
        .notebook(notebook.id)
        .favorite()
        .then(() => {
          showSnack("Notebook favorited!", Icon.Check);
          ev.emit("refreshNotebooks");
        })
  },
  { title: "Edit" },
  { title: "Share" },
  {
    title: "Delete",
    color: "red",
    onClick: () => {
      db.notebooks.delete(notebook.id).then(
        //TODO implement undo
        () => {
          showSnack("Notebook deleted!", Icon.Check);
          ev.emit("refreshNotebooks");
        }
      );
    }
  }
];
const Notebook = ({ item, index, onClick, onTopicClick }) => {
  const notebook = item;
  return (
    <ListItem
      onClick={onClick}
      title={notebook.title}
      body={notebook.description}
      subBody={
        <Flex sx={{ marginBottom: 1 }}>
          {notebook.topics.slice(1, 4).map(topic => (
            <Flex
              onClick={e => {
                onTopicClick(notebook, topic);
                e.stopPropagation();
              }}
              key={topic.id + topic.title}
              bg="primary"
              px={2}
              py={1}
              sx={{
                marginRight: 1,
                borderRadius: "default",
                color: "static"
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
        <Flex justifyContent="center" alignItems="center">
          {new Date(notebook.dateCreated).toDateString().substring(4)}
          <Text as="span" mx={1}>
            •
          </Text>
          <Text>{notebook.totalNotes} Notes</Text>
          {notebook.favorite && (
            <Icon.Star size={16} style={{ marginLeft: 5 }} />
          )}
        </Flex>
      }
      pinned={notebook.pinned}
      dropdownRefs={dropdownRefs}
      index={index}
      menuData={notebook}
      menuItems={menuItems(notebook)}
    />
  );
};

export default Notebook;
