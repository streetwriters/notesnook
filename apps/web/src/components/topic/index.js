import React from "react";
import ListItem from "../list-item";

const dropdownRefs = [];
const menuItems = [
  {
    title: "Delete",
    color: "red"
  }
];

const Topic = ({ item, index, onClick }) => {
  const topic = item;
  return (
    <ListItem
      selectable
      item={topic}
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
