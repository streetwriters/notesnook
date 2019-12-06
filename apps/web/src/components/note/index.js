import React from "react";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";

const dropdownRefs = [];
const menuItems = [
  { title: "Favorite", icon: Icon.Heart },
  { title: "Share", icon: Icon.Share2 },
  {
    title: "Delete",
    icon: Icon.Trash,
    color: "red",
    onClick: note => {
      ev.emit("onClearNote", note.dateCreated);
      db.deleteNotes([note]).then(
        //TODO implement undo
        () => {
          showSnack("Note deleted!", Icon.Check);
          ev.emit("refreshNotes");
        }
      );
    }
  }
];

function sendOpenNoteEvent(note) {
  ev.emit("onOpenNote", note);
}

const Note = ({ item, index }) => {
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

export default Note;
