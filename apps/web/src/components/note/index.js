import React from "react";
import { Flex } from "rebass";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { ask, moveNote } from "../dialogs";

const dropdownRefs = [];
const menuItems = note => [
  {
    title: note.notebook.notebook ? "Move" : "Add to",
    onClick: async () => {
      console.log(note.id, note.notebook);
      if (await moveNote(note.id, note.notebook)) {
        showSnack("Note moved successfully!");
      }
    }
  },
  {
    title: note.pinned ? "Unpin" : "Pin",
    onClick: async () =>
      db.notes
        .note(note.id)
        .pin() /*db.pinItem("note", note.dateCreated)*/
        .then(() => {
          showSnack("Note pinned!", Icon.Check);
          ev.emit("refreshNotes");
        })
  },
  {
    title: note.favorite ? "Unfavorite" : "Favorite",
    onClick: async () =>
      db.notes
        .note(note.id)
        .favorite() /*db.favoriteItem("note", note.dateCreated)*/
        .then(() => {
          showSnack("Note favorited!", Icon.Check);
          ev.emit("refreshNotes");
        })
  },
  { title: "Edit" },
  { title: note.locked ? "Remove lock" : "Lock" }, //TODO
  { title: "Share" },
  {
    title: "Move to Trash",
    color: "red",
    onClick: () => {
      ask(
        Icon.Trash2,
        "Delete",
        "Are you sure you want to move this note to Trash? It will be moved to Trash and permanently deleted after 7 days."
      ).then(res => {
        if (res) {
          ev.emit("onClearNote", note.id);
          db.notes
            .delete(note.id) /*db.deleteNotes(note)*/
            .then(
              //TODO implement undo
              () => {
                showSnack("Note deleted!", Icon.Check);
                ev.emit("refreshNotes");
              }
            )
            .catch(console.log);
        }
      });
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
