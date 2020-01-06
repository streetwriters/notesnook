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
    color: "red",
  }
];

function sendOpenNoteEvent(note) {
  ev.emit("onOpenNote", note);
}

const Trash = ({ item, index }) => {
  const note = item;
  return (
    <ListItem
      title={note.title}
      body={note.headline}
      index={index}
      onClick={sendOpenNoteEvent.bind(this, note)}
      info={<TimeAgo datetime={note.dateCreated} />}
      menuData={note}
      menuItems={menuItems}
      dropdownRefs={dropdownRefs}
    />
  );
};

export default Trash;