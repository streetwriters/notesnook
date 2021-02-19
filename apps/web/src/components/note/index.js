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
import Colors from "../menu/colors";
import { showExportDialog } from "../../common/dialog-controller";
import { showItemDeletedToast } from "../../common/toasts";
import { showUnpinnedToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";
import { hashNavigate } from "../../navigation";

function Note(props) {
  const { item, index, context } = props;
  const note = item;
  const selectedNote = useStore((store) => store.selectedNote);
  const isOpened = selectedNote === note.id;
  const [shade, primary] = useMemo(() => {
    if (!note.color) return ["shade", "primary"];
    const noteColor = COLORS[note.color];
    return [noteColor + "11", noteColor];
  }, [note.color]);

  const notebooksText = useMemo(() => {
    if (!note.notebooks?.length) return;
    const firstNotebook = note.notebooks[0];
    const title = db.notebooks.notebook(firstNotebook.id)?.title;
    const remainingNotebooks = note.notebooks.length - 1;
    let otherText = "";
    if (remainingNotebooks) {
      otherText = " & ";
      otherText +=
        remainingNotebooks === 1 ? "1 other" : `${remainingNotebooks} others`;
    }
    return title + otherText;
  }, [note.notebooks]);

  return (
    <ListItem
      selectable
      item={note}
      title={note.title}
      body={note.headline}
      id={note.id}
      index={index}
      colors={{ shade, primary, text: note.color ? primary : "text" }}
      menu={{
        items: context?.type === "topic" ? topicNoteMenuItems : menuItems,
        extraData: { note, context },
      }}
      onClick={() => {
        if (note.conflicted) {
          hashNavigate(`/notes/${note.id}/conflict`, true);
        } else if (note.locked) {
          hashNavigate(`/notes/${note.id}/unlock`, true);
        } else {
          hashNavigate(`/notes/${note.id}/edit`, true);
        }
      }}
      header={
        notebooksText && (
          <Flex
            alignSelf="flex-start"
            justifySelf="flex-start"
            alignContent="center"
            justifyContent="center"
          >
            <Icon.Notebook size={12} color={primary} />
            <Text variant="subBody" color={primary} fontWeight="600" ml={"3px"}>
              {notebooksText}
            </Text>
          </Flex>
        )
      }
      footer={
        <Flex mt={1} sx={{ fontSize: "subBody", color: "fontTertiary" }}>
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
          {note.pinned && !props.context && (
            <Icon.PinFilled color="primary" size={10} sx={{ mr: 1 }} />
          )}
          <TimeAgo live={false} datetime={note.dateCreated} />
          {note.locked && (
            <Icon.Lock
              size={13}
              color={"fontTertiary"}
              sx={{ ml: 1 }}
              data-test-id={`note-${index}-locked`}
            />
          )}
          {note.favorite && (
            <Icon.Star color={"favorite"} size={13} sx={{ ml: 1 }} />
          )}
          {isOpened && (
            <Text
              display="flex"
              bg={shade}
              justifyContent="center"
              alignItems="center"
              px="2px"
              py="2px"
              sx={{
                position: "absolute",
                bottom: 2,
                right: 2,
                borderRadius: "default",
              }}
              fontWeight="bold"
              color={primary}
              fontSize={8}
            >
              <Icon.Edit color={primary} size={8} /> EDITING NOW
            </Text>
          )}
        </Flex>
      }
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

const pin = async (note) => {
  await store.pin(note.id);
  if (note.pinned) await showUnpinnedToast(note.id, "note");
};

const menuItems = [
  {
    key: "colors",
    title: () => "Colors",
    component: ({ data }) => <Colors note={data.note} />,
  },
  {
    key: "addtonotebook",
    title: () => "Add to notebook",
    onClick: async ({ note }) => {
      await showMoveNoteDialog([note.id]);
    },
  },
  {
    key: "pin",
    title: ({ note }) => (note.pinned ? "Unpin" : "Pin"),
    onClick: async ({ note }) => {
      await pin(note);
    },
  },
  {
    key: "favorite",
    title: ({ note }) => (note.favorite ? "Unfavorite" : "Favorite"),
    onClick: ({ note }) => store.favorite(note),
  },
  {
    key: "export",
    title: () => "Export",
    onClick: async ({ note }) => {
      if (await showExportDialog([note.id]))
        showToast("success", `Note exported successfully!`);
    },
    isPro: true,
  },
  {
    key: "unlocknote",
    title: ({ note }) => (note.locked ? "Unlock" : "Lock"),
    onClick: async ({ note }) => {
      const { unlock, lock } = store.get();
      if (!note.locked) {
        if (await lock(note.id))
          showToast("success", "Note locked successfully!");
      } else {
        if (await unlock(note.id))
          showToast("success", "Note unlocked successfully!");
      }
    },
    isPro: true,
  },
  {
    key: "movetotrash",
    title: () => "Move to Trash",
    color: "red",
    onClick: async ({ note }) => {
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

const topicNoteMenuItems = [
  ...menuItems,
  [
    {
      key: "removefromtopic",
      title: "Remove from topic",
      onClick: async ({ note, context }) => {
        console.log("Remove from topic:", Object.isExtensible(note));
        await db.notebooks
          .notebook(context.value.id)
          .topics.topic(context.value.topic)
          .delete(note.id);
        store.setContext(context);
        await showToast("success", "Note removed from topic!");
      },
    },
  ],
];
