import React, { useMemo } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import TimeAgo from "timeago-react";
import ListItem from "../list-item";
import { confirm, showDeleteConfirmation } from "../dialogs/confirm";
import { showMoveNoteDialog } from "../dialogs/movenotedialog";
import { store, useStore } from "../../stores/note-store";
import { store as editorStore } from "../../stores/editor-store";
import { showPasswordDialog } from "../dialogs/passworddialog";
import { db, COLORS } from "../../common";
import { useTheme } from "emotion-theming";
import Colors from "../menu/colors";
import { showExportDialog } from "../dialogs/exportdialog";
import { setHashParam } from "../../utils/useHashParam";
import { showItemDeletedToast } from "../../common/toasts";
import { showUnpinnedToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";

const pin = async (note) => {
  await store.pin(note.id);
  if (note.pinned) await showUnpinnedToast(note.id, "note");
};

function menuItems(note, context) {
  return [
    { title: "colors", component: Colors },
    {
      title: note.notebook?.id ? "Move" : "Add to",
      onClick: async () => {
        await showMoveNoteDialog([note.id]);
      },
    },
    {
      title: note.pinned ? "Unpin" : "Pin",
      onClick: pin.bind(this, note),
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
        if (await showExportDialog(note))
          showToast("success", `Note exported successfully!`);
      },
      onlyPro: true,
    },
    { title: "Edit", onClick: () => editorStore.openSession(note) },
    {
      title: note.locked ? "Unlock" : "Lock",
      onClick: async () => {
        const { unlock, lock } = store.get();
        if (!note.locked) {
          if (await lock(note.id))
            showToast("success", "Note locked successfully!");
        } else {
          if (await unlock(note.id))
            showToast("success", "Note unlocked successfully!");
        }
      },
      onlyPro: true,
    },
    {
      visible: context?.type === "topic",
      title: "Remove from topic",
      onClick: async () => {
        confirm(Icon.Topic, {
          title: "Remove Note from Topic",
          subtitle: "Are you sure you want to remove the note from this topic?",
          yesText: "Remove note",
          noText: "Cancel",
          message: (
            <Text as="span">
              <Text as="span" color="primary">
                This action does not delete the note.
              </Text>{" "}
              The note will only be removed from this notebook. You will still
              be able to{" "}
              <Text as="span" color="primary">
                access it from Home and other places.
              </Text>
            </Text>
          ),
        }).then(async (res) => {
          if (res) {
            console.log(context);
            await db.notebooks
              .notebook(context.value.id)
              .topics.topic(context.value.topic)
              .delete(note.id);
            store.setContext(context);
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
        showDeleteConfirmation("note").then(async (res) => {
          if (res) {
            await store.delete(note.id).then(() => showItemDeletedToast(note));
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
  const color = useMemo(() => COLORS[note.colors[0]], [note.colors]);
  const notebook = useMemo(
    () => note.notebook && db.notebooks.notebook(note.notebook.id).data,
    [note.notebook]
  );

  return (
    <ListItem
      selectable
      focused={isOpened}
      item={note}
      title={note.title}
      body={note.headline}
      id={note.id}
      index={index}
      header={
        note.notebook && (
          <Flex
            alignSelf="flex-start"
            justifySelf="flex-start"
            alignContent="center"
            justifyContent="center"
            mb={1}
          >
            <Icon.Notebook size={12} color={color ? color : "primary"} />
            <Text variant="subBody" fontWeight="600" mt={"4px"} ml={"3px"}>
              {notebook.title}
            </Text>
          </Flex>
        )
      }
      bg={color}
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
            {/* {note.colors.map((item, colorIndex) => (
              <Box
                key={item}
                style={{
                  width: 13,
                  marginLeft: colorIndex ? -8 : 0,
                  marginRight: colorIndex === note.colors.length - 1 ? 5 : 0,
                  height: 13,
                  backgroundColor: COLORS[item],
                  borderRadius: 100,
                }}
                data-test-id={`note-${index}-colors-${item}`}
              />
            ))} */}
            <TimeAgo datetime={note.dateCreated} />
            {note.locked && (
              <Icon.Lock
                size={13}
                color={theme.colors.fontTertiary}
                sx={{ ml: 1 }}
                data-test-id={`note-${index}-locked`}
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
