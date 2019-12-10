import React from "react";
import { Flex, Text } from "rebass";
import * as Icon from "react-feather";
import ListItem from "../list-item";

const dropdownRefs = [];
const menuItems = [
  { title: "Favorite", icon: Icon.Heart },
  { title: "Share", icon: Icon.Share2 },
  {
    title: "Delete",
    icon: Icon.Trash,
    color: "red"
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
        <Text>
          {new Date(notebook.dateCreated).toDateString().substring(4)}
          <Text as="span" color="text">
            {" • " + notebook.totalNotes} Notes
          </Text>
        </Text>
      }
      dropdownRefs={dropdownRefs}
      index={index}
      menuData={notebook}
      menuItems={menuItems}
    />
  );
};

export default Notebook;
