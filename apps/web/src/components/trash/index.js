import React from "react";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";

const dropdownRefs = [];
const menuItems = [
  { title: "Restore" },
  {
    title: "Delete",
    color: "red"
  }
];

const Trash = ({ item, index }) => {
  const trashItem = item;
  return (
    <ListItem
      title={trashItem.title}
      body={trashItem.headline}
      index={index}
      onClick={() => {}} //TODO
      info={<TimeAgo datetime={trashItem.dateDeleted} />}
      menuData={trashItem}
      menuItems={menuItems}
      dropdownRefs={dropdownRefs}
    />
  );
};

export default Trash;
