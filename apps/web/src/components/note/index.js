import React from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "../icons";
import TimeAgo from "timeago-react";
import ListItem from "../list-item";
import { confirm } from "../dialogs/confirm";
import { showMoveNoteDialog } from "../dialogs/movenotedialog";
import { store, useStore } from "../../stores/note-store";
import { store as editorStore } from "../../stores/editor-store";
import { showPasswordDialog } from "../dialogs/passworddialog";
import { db, COLORS } from "../../common";
import { useTheme } from "emotion-theming";
import Colors from "../menu/colors";
import { showExportDialog } from "../dialogs/exportdialog";
import { setHashParam } from "../../utils/useHashParam";

function menuItems(note, context) {
  return [
    { title: "colors", component: Colors },
    {
      title: note.notebook?.id ? "Move" : "Add to",
      onClick: async () => {
        if (await showMoveNoteDialog([note.id])) {
          console.log("Note moved successfully!");
        }
      },
    },
    {
      title: note.pinned ? "Unpin" : "Pin",
      onClick: () => store.pin(note),
      onlyPro: true,
    },
    {
      title: note.favorite ? "Unfavorite" : "Favorite",
      onClick: () => store.favorite(note),
      onlyPro: true,
    },
    {
      title: "Export",
      onClick: async () => {
        await showExportDialog(note);
      },
      onlyPro: true,
    },
    { title: "Edit", onClick: () => editorStore.openSession(note) },
    {
      title: note.locked ? "Unlock" : "Lock",
      onClick: async () => {
        const { unlock, lock } = store;
        if (!note.locked) {
          lock(note.id);
        } else {
          unlock(note.id);
        }
      },
      onlyPro: true,
    },
    {
      visible: context?.type === "topic",
      title: "Remove",
      onClick: async () => {
        confirm(
          Icon.Topic,
          "Remove from Topic",
          "Are you sure you want to remove this note?"
        ).then(async (res) => {
          if (res) {
            await db.notebooks
              .notebook(context.notebook.id)
              .topics.topic(context.value)
              .delete(note.id);
            await store.setContext(context);
          }
        });
      },
    },
    {
      title: "Move to Trash",
      color: "red",
      onClick: async () => {
        if (note.locked) {
          const res = await showPasswordDialog("unlock_note", (password) => {
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
        ).then(async (res) => {
          if (res) {
            await store.delete(note.id);
          }
        });
      },
    },
  ];
}

function Note(props) {
  const { item, index, pinnable } = props;
  const note = item;
  const selectedNote = useStore((store) => store.selectedNote);
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
      onClick={() => {
        if (note.conflicted) {
          setHashParam({ diff: note.id });
        } else {
          setHashParam({ note: note.id });
        }
      }}
      info={
        <Flex flex="1 1 auto" justifyContent="space-between">
          <Flex variant="rowCenter">
            {note.colors.map((item, index) => (
              <Box
                key={item}
                style={{
                  width: 13,
                  marginLeft: index ? -8 : 0,
                  marginRight: index === note.colors.length - 1 ? 5 : 0,
                  height: 13,
                  backgroundColor: COLORS[item],
                  borderRadius: 100,
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
              <Icon.Star
                color={theme.colors.favorite}
                size={13}
                sx={{ ml: 1 }}
              />
            )}
          </Flex>
          {note.conflicted && (
            <Text
              ml={1}
              p={1}
              bg="error"
              color="static"
              sx={{ borderRadius: "default" }}
            >
              CONFLICT
            </Text>
          )}
        </Flex>
      }
      pinned={pinnable && note.pinned}
      menuData={note}
      menuItems={menuItems(note, props.context)}
    />
  );
}

export default React.memo(Note, function (prevProps, nextProps) {
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;

  return (
    prevItem.pinned === nextItem.pinned &&
    prevItem.favorite === nextItem.favorite &&
    prevItem.headline === nextItem.headline &&
    prevItem.title === nextItem.title &&
    prevItem.locked === nextItem.locked &&
    prevItem.conflicted === nextItem.conflicted &&
    JSON.stringify(prevItem.colors) === JSON.stringify(nextItem.colors)
  );
});
