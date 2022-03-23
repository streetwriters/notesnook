import React, { useMemo } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import TimeAgo from "../time-ago";
import ListItem from "../list-item";
import { confirm, showMoveNoteDialog } from "../../common/dialog-controller";
import { store, useStore } from "../../stores/note-store";
import { useStore as useAttachmentStore } from "../../stores/attachment-store";
import { db } from "../../common/db";
import { showUnpinnedToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";
import { hashNavigate, navigate } from "../../navigation";
import { showPublishView } from "../publish-view";
import IconTag from "../icon-tag";
import { COLORS } from "../../common/constants";
import { exportNotes } from "../../common/export";
import { Multiselect } from "../../common/multi-select";
import { store as selectionStore } from "../../stores/selection-store";

function Note(props) {
  const { tags, notebook, item, index, context, date } = props;
  const note = item;
  const isOpened = useStore((store) => store.selectedNote === note.id);
  const isCompact = useStore((store) => store.viewMode === "compact");
  const attachments = useAttachmentStore((store) =>
    store.attachments.filter((a) => a.noteIds.includes(note.id))
  );
  const failed = useMemo(
    () => attachments.filter((a) => a.failed),
    [attachments]
  );

  const primary = useMemo(() => {
    if (!note.color) return "primary";
    return note.color.toLowerCase();
  }, [note.color]);

  return (
    <ListItem
      selectable
      isFocused={isOpened}
      isCompact={isCompact}
      item={note}
      title={note.title}
      body={note.headline}
      id={note.id}
      index={index}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          let selectedItems = selectionStore
            .get()
            .selectedItems.filter((i) => i.type === item.type && i !== item);
          await Multiselect.moveNotesToTrash([item, ...selectedItems]);
        }
      }}
      colors={{
        primary,
        text: note.color ? primary : "text",
        background: isOpened ? "bgSecondary" : "background",
      }}
      menu={{
        items: context?.type === "topic" ? topicNoteMenuItems : menuItems,
        extraData: { note, context },
      }}
      onClick={() => {
        if (note.conflicted) {
          hashNavigate(`/notes/${note.id}/conflict`, { replace: true });
        } else if (note.locked) {
          hashNavigate(`/notes/${note.id}/unlock`, { replace: true });
        } else {
          hashNavigate(`/notes/${note.id}/edit`, { replace: true });
        }
      }}
      header={
        notebook && (
          <IconTag
            styles={{
              container: {
                alignSelf: "flex-start",
                justifySelf: "flex-start",
                mb: 1,
              },
            }}
            onClick={() => {
              navigate(`/notebooks/${notebook.id}/${notebook.topic.id}`);
            }}
            text={`${notebook.title} › ${notebook.topic.title}`}
            icon={Icon.Notebook}
          />
        )
      }
      footer={
        <Flex
          alignItems="center"
          sx={{
            fontSize: "subBody",
            color: isOpened ? "bgSecondaryText" : "fontTertiary",
          }}
        >
          {isCompact ? (
            <>
              {note.conflicted && (
                <Icon.Alert size={15} color="error" sx={{ mr: 1 }} />
              )}
              {note.locked && (
                <Icon.Lock
                  size={11}
                  color={"fontTertiary"}
                  sx={{ mr: 1 }}
                  data-test-id={`note-${index}-locked`}
                />
              )}
              {note.favorite && (
                <Icon.Star color={primary} size={15} sx={{ mr: 1 }} />
              )}
              <TimeAgo live={true} datetime={date} locale="short" />
            </>
          ) : (
            <>
              {note.conflicted && (
                <Icon.Alert size={15} color="error" sx={{ mr: 1 }} />
              )}

              {note.localOnly && <Icon.SyncOff size={13} sx={{ mr: 1 }} />}

              <TimeAgo
                sx={{ flexShrink: 0 }}
                locale="en_short"
                live={true}
                datetime={date}
                mr={1}
              />

              {attachments.length > 0 && (
                <Flex mr={1}>
                  <Icon.Attachment size={13} color="fontTertiary" />
                  <Text ml={"2px"}>{attachments.length}</Text>
                </Flex>
              )}

              {failed.length > 0 && (
                <Flex mr={1} title={`Errors in ${failed.length} attachments.`}>
                  <Icon.AttachmentError size={13} color="error" />
                  <Text ml={"2px"}>{failed.length}</Text>
                </Flex>
              )}

              {note.pinned && !props.context && (
                <Icon.Pin size={13} color={primary} sx={{ mr: 1 }} />
              )}

              {note.locked && (
                <Icon.Lock
                  size={13}
                  color={"fontTertiary"}
                  sx={{ mr: 1 }}
                  data-test-id={`note-${index}-locked`}
                />
              )}

              {note.favorite && (
                <Icon.Star color={primary} size={15} sx={{ mr: 1 }} />
              )}

              {tags?.map((tag) => {
                return (
                  <Button
                    data-test-id={`note-${index}-tags-${tag.alias}`}
                    key={tag.id}
                    variant="anchor"
                    mr={1}
                    color="fontTertiary"
                    title={`Go to #${tag.alias}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!tag.id) return showToast("Tag not found.");
                      navigate(`/tags/${tag.id}`);
                    }}
                    sx={{
                      maxWidth: `calc(100% / ${tags.length})`,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    #{tag.alias}
                  </Button>
                );
              })}
            </>
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
    prevProps.date === nextProps.date &&
    prevItem.pinned === nextItem.pinned &&
    prevItem.favorite === nextItem.favorite &&
    prevItem.localOnly === nextItem.localOnly &&
    prevItem.headline === nextItem.headline &&
    prevItem.title === nextItem.title &&
    prevItem.locked === nextItem.locked &&
    prevItem.conflicted === nextItem.conflicted &&
    prevItem.color === nextItem.color &&
    prevProps.notebook?.dateEdited === nextProps.notebook?.dateEdited &&
    JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags)
  );
});

const pin = (note) => {
  return store
    .pin(note.id)
    .then(async () => {
      if (note.pinned) await showUnpinnedToast(note.id, "note");
    })
    .catch((error) => showToast("error", error.message));
};

const formats = [
  {
    type: "pdf",
    title: "PDF",
    icon: Icon.PDF,
    subtitle:
      "Can be opened in any PDF reader like Adobe Acrobat or Foxit Reader.",
  },
  {
    type: "md",
    title: "Markdown",
    icon: Icon.Markdown,
    subtitle: "Can be opened in any plain-text or markdown editor.",
  },
  {
    type: "html",
    title: "HTML",
    icon: Icon.HTML,
    subtitle: "Can be opened in any web browser like Google Chrome.",
  },
  {
    type: "txt",
    title: "Text",
    icon: Icon.Text,
    subtitle: "Can be opened in any plain-text editor.",
  },
];

const menuItems = [
  {
    key: "pin",
    title: ({ note }) => (note.pinned ? "Unpin" : "Pin"),
    icon: Icon.Pin,
    onClick: async ({ note }) => {
      await pin(note);
    },
  },
  {
    key: "favorite",
    title: ({ note }) => (note.favorite ? "Unfavorite" : "Favorite"),
    icon: Icon.StarOutline,
    onClick: ({ note }) => store.favorite(note),
  },
  {
    key: "addtonotebook",
    title: "Add to notebook(s)",
    icon: Icon.AddToNotebook,
    onClick: async ({ items }) => {
      await showMoveNoteDialog(items.map((i) => i.id));
    },
    multiSelect: true,
  },
  {
    key: "colors",
    title: "Assign color",
    icon: Icon.Colors,
    items: colorsToMenuItems(),
  },
  {
    key: "publish",
    disabled: ({ note }) => !db.monographs.isPublished(note.id) && note.locked,
    disableReason: "You cannot publish a locked note.",
    icon: Icon.Publish,
    title: ({ note }) =>
      db.monographs.isPublished(note.id) ? "Unpublish" : "Publish",
    onClick: async ({ note }) => {
      await showPublishView(note.id, "bottom");
    },
  },
  {
    key: "export",
    title: "Export as",
    icon: Icon.Export,
    disabled: ({ note }) => note.locked,
    disableReason: "Locked notes cannot be exported currently.",
    items: formats.map((format) => ({
      key: format.type,
      title: format.title,
      tooltip: `Export as ${format.title} - ${format.subtitle}`,
      icon: format.icon,
      disabled: ({ items }) => format.type === "pdf" && items.length > 1,
      disableReason: "Multiple notes cannot be exported as PDF.",
      onClick: async ({ items }) => {
        await exportNotes(
          format.type,
          items.map((i) => i.id)
        );
      },
    })),
    multiSelect: true,
    isPro: true,
  },
  {
    key: "duplicate",
    title: "Duplicate",
    disabled: ({ note }) => note.locked,
    disableReason: "Locked notes cannot be duplicated",
    icon: Icon.Duplicate,
    onClick: async ({ note }) => {
      const id = await store.get().duplicate(note);
      if (
        await confirm({
          title: "Open duplicated note?",
          message: "Do you want to open the duplicated note?",
          noText: "No",
          yesText: "Yes",
        })
      ) {
        hashNavigate(`/notes/${id}/edit`, { replace: true });
      }
    },
  },
  {
    key: "lock",
    title: ({ note }) => (note.locked ? "Unlock" : "Lock"),
    icon: Icon.Lock,
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
    key: "sync-disable",
    title: ({ note }) => (note.localOnly ? "Enable sync" : "Disable sync"),
    icon: ({ note }) => (note.localOnly ? Icon.Sync : Icon.SyncOff),
    onClick: async ({ note }) => {
      if (
        note.localOnly ||
        (await confirm({
          title: "Disable sync for this item?",
          message:
            "Turning sync off for this item will automatically delete it from all other devices. Are you sure you want to continue?",
          yesText: "Yes",
          noText: "No",
        }))
      )
        await store.get().localOnly(note.id);
    },
  },
  {
    key: "movetotrash",
    title: "Move to trash",
    color: "error",
    iconColor: "error",
    icon: Icon.Trash,
    disabled: ({ items }) =>
      items.length === 1 && db.monographs.isPublished(items[0].id),
    disableReason: "Please unpublish this note to move it to trash",
    onClick: async ({ items }) => {
      await Multiselect.moveNotesToTrash(items);
    },
    multiSelect: true,
  },
];

const topicNoteMenuItems = [
  ...menuItems,
  {
    key: "removefromtopic",
    title: "Remove from topic",
    icon: Icon.TopicRemove,
    color: "error",
    iconColor: "error",
    onClick: async ({ items, context }) => {
      await db.notebooks
        .notebook(context.value.id)
        .topics.topic(context.value.topic)
        .delete(...items.map((i) => i.id));
      store.refresh();
    },
    multiSelect: true,
  },
];

function colorsToMenuItems() {
  console.log(COLORS);
  return COLORS.map((label) => {
    const lowercase = label.toLowerCase();
    return {
      key: lowercase,
      title: () => db.colors.alias(lowercase) || label,
      icon: Icon.Circle,
      iconColor: lowercase,
      checked: ({ note }) => {
        return note.color === lowercase;
      },
      onClick: ({ note }) => {
        const { id } = note;
        store.setColor(id, lowercase);
      },
    };
  });
}
