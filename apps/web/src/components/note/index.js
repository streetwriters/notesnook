import React, { useMemo } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import TimeAgo from "timeago-react";
import ListItem from "../list-item";
import { showMoveNoteDialog } from "../../common/dialog-controller";
import { store, useStore } from "../../stores/note-store";
import { showPasswordDialog } from "../../common/dialog-controller";
import { COLORS } from "../../common";
import { db } from "../../common/db";
import { useTheme } from "emotion-theming";
import Colors from "../menu/colors";
import { showExportDialog } from "../../common/dialog-controller";
import { showItemDeletedToast } from "../../common/toasts";
import { showUnpinnedToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";
import { hashNavigate } from "../../navigation";

const pin = async (note) => {
  await store.pin(note.id);
  if (note.pinned) await showUnpinnedToast(note.id, "note");
};

function menuItems(note, context) {
  return [
    { title: "colors", component: <Colors data={note} /> },
    {
      title: "Add to notebook",
      onClick: async () => {
        await showMoveNoteDialog([note.id]);
      },
    },
    {
      title: note.pinned ? "Unpin" : "Pin",
      onClick: async () => {
        await pin(note);
      },
    },
    {
      title: note.favorite ? "Unfavorite" : "Favorite",
      onClick: () => store.favorite(note),
    },
    {
      title: "Export",
      onClick: async () => {
        if (await showExportDialog([note.id]))
          showToast("success", `Note exported successfully!`);
      },
      onlyPro: true,
    },
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
        console.log("Remove from topic:", Object.isExtensible(note));
        await db.notebooks
          .notebook(context.value.id)
          .topics.topic(context.value.topic)
          .delete(note.id);
        store.setContext(context);
        await showToast("success", "Note removed from topic!");
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
        await store.delete(note.id).then(() => showItemDeletedToast(note));
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
  const color = useMemo(() => COLORS[note.color], [note.color]);
  const notebook = useMemo(
    () =>
      !!note.notebooks?.length &&
      db.notebooks.notebook(note.notebooks[0].id)?.data,
    [note.notebooks]
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
        notebook && (
          <Flex
            alignSelf="flex-start"
            justifySelf="flex-start"
            alignContent="center"
            justifyContent="center"
          >
            <Icon.Notebook size={12} color={color ? color : "primary"} />
            <Text
              variant="subBody"
              color={color ? color : "primary"}
              fontWeight="600"
              ml={"3px"}
            >
              {notebook.title}
            </Text>
          </Flex>
        )
      }
      bg={color}
      onClick={() => {
        if (note.conflicted) {
          hashNavigate(`/notes/${note.id}/conflict`, true);
        } else if (note.locked) {
          hashNavigate(`/notes/${note.id}/unlock`, true);
        } else {
          hashNavigate(`/notes/${note.id}/edit`, true);
        }
      }}
      info={
        <>
          {note.conflicted && (
            <Text
              mr={1}
              px={1}
              py="1px"
              bg="error"
              fontSize="subBody"
              color="static"
              sx={{ borderRadius: "default" }}
            >
              CONFLICT
            </Text>
          )}
          <Flex variant="rowCenter">
            {note.pinned && !props.context && (
              <Icon.PinFilled color="primary" size={10} sx={{ mr: 1 }} />
            )}
            <TimeAgo
              live={false}
              style={{ fontSize: theme.fontSizes["subBody"] }}
              datetime={note.dateCreated}
            />
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
        </>
      }
      pinned={pinnable && note.pinned}
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
    prevItem.color === nextItem.color &&
    prevItem.notebooks?.length === nextItem.notebooks?.length
  );
});
