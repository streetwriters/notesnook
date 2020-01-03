import React from "react";
import { Flex } from "rebass";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { navigate, routes } from "../../navigation";

const dropdownRefs = [];
const menuItems = note => [
  {
    title: note.notebook.notebook ? "Move" : "Add to notebook",
    onClick: () => {
      navigate(routes.notebooks.key, undefined, {
        intent: "moveNote",
        data: note
      });
    }
  },
  {
    title: note.pinned ? "Unpin" : "Pin",
    onClick: async () =>
      db.pinItem("note", note.dateCreated).then(() => {
        showSnack("Note pinned!", Icon.Check);
        ev.emit("refreshNotes");
      })
  },
  {
    title: note.favorite ? "Unfavorite" : "Favorite",
    onClick: async () =>
      db.favoriteItem("note", note.dateCreated).then(() => {
        showSnack("Note favorited!", Icon.Check);
        ev.emit("refreshNotes");
      })
  },
  { title: "Edit" },
  { title: note.locked ? "Remove lock" : "Lock" }, //TODO
  { title: "Share" },
  {
    title: "Delete",
    color: "red",
    onClick: () => {
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
      info={
        <Flex justifyContent="center" alignItems="center">
          <TimeAgo datetime={note.dateCreated} />
          {note.locked && <Icon.Lock size={16} style={{ marginLeft: 5 }} />}
          {note.favorite && <Icon.Star size={16} style={{ marginLeft: 5 }} />}
        </Flex>
      }
      pinned={note.pinned}
      menuData={note}
      menuItems={menuItems(note)}
      dropdownRefs={dropdownRefs}
    />
  );
};

export default Note;
