import React from "react";
import { Flex } from "rebass";
import * as Icon from "react-feather";
import TimeAgo from "timeago-react";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { confirm } from "../dialogs/confirm";
import { showMoveNoteDialog } from "../dialogs/movenotedialog";
import { store, useStore } from "../../stores/note-store";
import { store as editorStore } from "../../stores/editor-store";

const dropdownRefs = [];
const menuItems = (note, index, groupIndex) => [
  {
    title: note.notebook ? "Move" : "Add to",
    onClick: async () => {
      if (await showMoveNoteDialog([note.id])) {
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
  { title: "Edit", onClick: () => editorStore.getState().openSession(note) },
  { title: note.locked ? "Remove lock" : "Lock" }, //TODO
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

function Note(props) {
  const { item, index, groupIndex } = props;
  const note = item;
  const selectedNote = useStore(store => store.selectedNote);
  const isOpened = selectedNote === note.id;
  return (
    <ListItem
      selectable
      focused={isOpened}
      item={note}
      title={note.title}
      body={note.headline}
      id={note.id}
      index={index}
      onClick={async () => {
        await editorStore.getState().openSession(note);
      }}
      info={
        <Flex justifyContent="center" alignItems="center">
          <TimeAgo datetime={note.dateCreated} />
          {note.locked && <Icon.Lock size={13} style={{ marginLeft: 5 }} />}
          {note.favorite && <Icon.Star size={13} style={{ marginLeft: 5 }} />}
        </Flex>
      }
      pinned={note.pinned}
      menuData={note}
      menuItems={menuItems(note, index, groupIndex)}
      dropdownRefs={dropdownRefs}
    />
  );
}

export default React.memo(Note, function(prevProps, nextProps) {
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;
  return (
    prevItem.pinned === nextItem.pinned &&
    prevItem.favorite === nextItem.favorite &&
    prevItem.headline === nextItem.headline &&
    prevItem.title === nextItem.title
  );
});
