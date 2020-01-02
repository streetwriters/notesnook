import React from "react";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { navigate, routes } from "../../navigation";

const dropdownRefs = [];
const menuItems = [
  {
    title: "Move",
    onClick: note => {
      navigate(routes.notebooks.key, undefined, {
        intent: "moveNote",
        data: note
      });
    }
  },
  { title: "Pin" },
  { title: "Favorite" },
  { title: "Share" },
  {
    title: "Delete",
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
