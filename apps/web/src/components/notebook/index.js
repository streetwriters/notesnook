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
      db.pinItem("notebook", notebook.dateCreated).then(() => {
        showSnack("Notebook pinned!", Icon.Check);
        ev.emit("refreshNotebooks");
      })
  },
  {
    title: notebook.favorite ? "Unfavorite" : "Favorite",
    onClick: async () =>
      db.favoriteItem("notebook", notebook.dateCreated).then(() => {
        showSnack("Notebook favorited!", Icon.Check);
        ev.emit("refreshNotebooks");
      })
  },
  { title: "Edit" },
  { title: "Share" },
  {
    title: "Delete",
    color: "red",
    onClick: () => {}
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
              key={topic.dateCreated + topic.title}
              bg="primary"
              px={1}
              py={1}
              sx={{
                marginRight: 1,
                borderRadius: "default",
                color: "fontSecondary"
              }}
            >
              <Text className="unselectable" variant="body" fontSize={11}>
                {topic.title}
              </Text>
            </Flex>
          ))}
        </Flex>
      }
      info={
        <Flex justifyContent="center" alignItems="center">
          {new Date(notebook.dateCreated).toDateString().substring(4)}
          <Text as="span">{" • " + notebook.totalNotes} Notes</Text>
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
