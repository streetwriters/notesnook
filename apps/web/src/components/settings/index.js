import React from "react";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { Virtuoso as List } from "react-virtuoso";

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

const Trash = () => {
  return (
   <div>My name is ALi.</div>
  );
};

export default Trash;