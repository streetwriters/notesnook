import React from "react";
import { Flex, Box } from "rebass";
import * as Icon from "../icons";
import TimeAgo from "timeago-react";
import { showSnack } from "../snackbar";
import ListItem from "../list-item";
import { confirm } from "../dialogs/confirm";
import { showMoveNoteDialog } from "../dialogs/movenotedialog";
import { store, useStore } from "../../stores/note-store";
import { store as editorStore } from "../../stores/editor-store";
import { showPasswordDialog } from "../dialogs/passworddialog";
import { db } from "../../common";
import { useTheme } from "emotion-theming";

const dropdownRefs = [];
function menuItems(note, context) {
  return [
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
      onClick: () => store.getState().favorite(note)
    },
    { title: "Edit", onClick: () => editorStore.getState().openSession(note) },
    {
      title: note.locked ? "Unlock" : "Lock",
      onClick: async () => {
        const { unlock, lock } = store.getState();
        if (!note.locked) {
          lock(note.id);
        } else {
          unlock(note.id);
        }
      }
    },
    {
      invisible: context ? (context.type === "topic" ? false : true) : true,
      title: "Remove",
      onClick: async () => {
        confirm(
          Icon.Topic,
          "Remove from Topic",
          "Are you sure you want to remove this note?"
        ).then(async res => {
          if (res) {
            await db.notebooks
              .notebook(context.notebook.id)
              .topics.topic(context.value)
              .delete(note.id);
            await store.getState().setSelectedContext(context);
          }
        });
      }
    },
    {
      title: "Move to Trash",
      color: "red",
      onClick: async () => {
        if (note.locked) {
          const res = await showPasswordDialog("unlock_note", password => {
            return db.vault
              .unlock(password)
              .then(() => true)
              .catch(() => false);
          });
          if (!res) return;
        }
        confirm(
          Icon.Trash,
          "Delete",
          "Are you sure you want to delete this note?"
        ).then(async res => {
          if (res) {
            await store.getState().delete(note.id);
          }
        });
      }
    }
  ];
}

function Note(props) {
  const { item, index } = props;
  const note = item;
  const selectedNote = useStore(store => store.selectedNote);
  const isOpened = selectedNote === note.id;
  const theme = useTheme();
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
          {note.colors.map((item, index) => (
            <Box
              key={item}
              style={{
                width: 13,
                marginLeft: index ? -8 : 0,
                marginRight: index === note.colors.length - 1 ? 5 : 0,
                height: 13,
                backgroundColor: item,
                borderRadius: 100
              }}
            />
          ))}
          <TimeAgo datetime={note.dateCreated} />
          {note.locked && (
            <Icon.Lock
              size={13}
              color={theme.colors.fontTertiary}
              sx={{ ml: 1 }}
            />
          )}
          {note.favorite && (
            <Icon.Star color={theme.colors.favorite} size={13} sx={{ ml: 1 }} />
          )}
        </Flex>
      }
      pinned={props.pinnable && note.pinned}
      menuData={note}
      menuItems={menuItems(note, props.context)}
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
    prevItem.title === nextItem.title &&
    prevItem.locked === nextItem.locked &&
    JSON.stringify(prevItem.colors) === JSON.stringify(nextItem.colors)
  );
});
