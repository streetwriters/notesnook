import React from "react";
import ListItem from "../list-item";
import { showEditTopicDialog } from "../dialogs/topicdialog";

const menuItems = (item) => [
  {
    title: "Edit",
    onClick: () => {
      showEditTopicDialog(item);
    },
    visible: item.title === "General",
  },
  {
    title: "Delete",
    color: "red",
  },
];

function Topic({ item, index, onClick }) {
  const topic = item;
  return (
    <ListItem
      selectable
      item={topic}
      onClick={onClick}
      title={topic.title}
      info={`${topic.totalNotes} Notes`}
      index={index}
      menuData={topic}
      menuItems={menuItems(topic)}
    />
  );
}
export default Topic;
