import React from "react";
import { Flex } from "rebass";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { confirm } from "../dialogs/confirm";
import { showMoveNoteDialog } from "../dialogs/movenotedialog";
import { store } from "../../stores/note-store";

const dropdownRefs = [];
const menuItems = (note, index, groupIndex) => [
  {
    title: note.notebook ? "Move" : "Add to",
    onClick: async () => {
      if (await showMoveNoteDialog(note.id)) {
        showSnack("Note moved successfully!");
      }
    }
  },
  {
    title: note.pinned ? "Unpin" : "Pin",
    onClick: () => store.getState().pin(note)
  },
  {
    title: note.favorite ? "Unfavorite" : "Favorite",
    onClick: () => store.getState().favorite(note, index)
  },
  { title: "Edit" },
  { title: note.locked ? "Remove lock" : "Lock" }, //TODO
  { title: "Share" },
  {
    title: "Move to Trash",
    color: "red",
    onClick: () => {
      confirm(
        Icon.Trash2,
        "Delete",
        "Are you sure you want to delete this note?"
      ).then(async res => {
        if (res) {
          await store.getState().delete(note.id, { index, groupIndex });
        }
      });
    }
  }
];

function sendOpenNoteEvent(note) {
  ev.emit("onOpenNote", note);
}

export default class Note extends React.Component {
  shouldComponentUpdate(nextProps) {
    const prevItem = this.props.item;
    const nextItem = nextProps.item;
    return (
      prevItem.pinned !== nextItem.pinned ||
      prevItem.favorite !== nextItem.favorite ||
      prevItem.headline !== nextItem.headline
    );
  }

  render() {
    const { item, index, groupIndex } = this.props;
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
        menuItems={menuItems(note, index, groupIndex)}
        dropdownRefs={dropdownRefs}
      />
    );
  }
}
