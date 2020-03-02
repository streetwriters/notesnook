import React from "react";
import { Text } from "rebass";
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

const Topic = ({ item, index, onClick }) => {
  const topic = item;
  return (
    <ListItem
      onClick={onClick}
      title={topic.title}
      info={`${topic.totalNotes} Notes`}
      index={index}
      dropdownRefs={dropdownRefs}
      menuData={topic}
      menuItems={menuItems}
    />
  );
};

export default Topic;
