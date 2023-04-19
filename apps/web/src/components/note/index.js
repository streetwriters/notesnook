/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { useMemo } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import TimeAgo from "../time-ago";
import ListItem from "../list-item";
import {
  confirm,
  showAddReminderDialog,
  showCustomExpiryDateDialog,
  showMoveNoteDialog
} from "../../common/dialog-controller";
import { store, useStore } from "../../stores/note-store";
import { store as userstore } from "../../stores/user-store";
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
import {
  formatReminderTime,
  isReminderActive,
  isReminderToday
} from "@notesnook/core/collections/reminders";

function Note(props) {
  const {
    tags,
    references,
    item,
    index,
    context,
    date,
    reminder,
    simplified,
    compact
  } = props;
  const note = item;

  const isOpened = useStore((store) => store.selectedNote === note.id);
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
      isCompact={compact}
      isSimple={simplified}
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
        background: isOpened ? "bgSecondary" : "background"
      }}
      menu={{
        items: menuItems,
        extraData: { note, context }
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
        <Flex
          sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, mt: "small" }}
        >
          {references?.references?.map((reference) => (
            <IconTag
              key={reference.url}
              onClick={() => {
                navigate(reference.url);
              }}
              text={reference.title}
              icon={reference.type === "topic" ? Icon.Topic : Icon.Notebook}
            />
          ))}
          {reminder && isReminderActive(reminder) && (
            <IconTag
              icon={Icon.Reminder}
              text={formatReminderTime(reminder, true)}
              title={reminder.title}
              styles={
                isReminderToday(reminder)
                  ? {
                      icon: { color: primary },
                      text: { color: primary }
                    }
                  : {}
              }
            />
          )}
        </Flex>
      }
      footer={
        <Flex
          sx={{
            fontSize: "subBody",
            color: isOpened ? "bgSecondaryText" : "fontTertiary",
            alignItems: "center"
          }}
        >
          {compact ? (
            <>
              {note.conflicted && (
                <Icon.Alert size={15} color="error" sx={{ mr: 1 }} />
              )}
              {note.locked && (
                <Icon.Lock
                  size={11}
                  color={"fontTertiary"}
                  sx={{ mr: 1 }}
                  data-test-id={`locked`}
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
                  data-test-id={`locked`}
                />
              )}

              {note.favorite && (
                <Icon.Star color={primary} size={15} sx={{ mr: 1 }} />
              )}

              {tags?.map((tag) => {
                return (
                  <Button
                    data-test-id={`tag-item`}
                    key={tag.id}
                    variant="anchor"
                    mr={1}
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
                      color: "fontTertiary"
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
    prevProps.compact === nextProps.compact &&
    prevProps.references?.dateEdited === nextProps.references?.dateEdited &&
    prevProps.reminder?.dateModified === nextProps.reminder?.dateModified &&
    JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags) &&
    JSON.stringify(prevProps.context) === JSON.stringify(nextProps.context)
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
      "Can be opened in any PDF reader like Adobe Acrobat or Foxit Reader."
  },
  {
    type: "md",
    title: "Markdown",
    icon: Icon.Markdown,
    subtitle: "Can be opened in any plain-text or markdown editor."
  },
  {
    type: "html",
    title: "HTML",
    icon: Icon.HTML,
    subtitle: "Can be opened in any web browser like Google Chrome."
  },
  {
    type: "txt",
    title: "Text",
    icon: Icon.Text,
    subtitle: "Can be opened in any plain-text editor."
  }
];

const notFullySyncedText =
  "Cannot perform this action because note is not fully synced.";
const menuItems = [
  {
    key: "pin",
    title: "Pin",
    checked: ({ note }) => note.pinned,
    icon: Icon.Pin,
    onClick: async ({ note }) => {
      await pin(note);
    }
  },
  {
    key: "readonly",
    title: "Readonly",
    checked: ({ note }) => note.readonly,
    icon: Icon.Readonly,
    onClick: ({ note }) => store.readonly(note.id)
  },
  {
    key: "favorite",
    title: "Favorite",
    checked: ({ note }) => note.favorite,
    icon: Icon.StarOutline,
    onClick: ({ note }) => store.favorite(note.id)
  },
  {
    key: "lock",
    disabled: ({ note }) =>
      !db.notes.note(note.id).synced() ? notFullySyncedText : false,
    title: "Lock",
    checked: ({ note }) => note.locked,
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
    isPro: true
  },
  {
    key: "remind-me",
    title: "Remind me",
    icon: Icon.AddReminder,
    onClick: async ({ note }) => {
      await showAddReminderDialog(note.id);
    }
  },
  {
    key: "set-expiry",
    title: "Set expiry",
    icon: Icon.expiryDate,
    items: expiryDateMenuItems
  },
  { key: "sep1", type: "separator" },
  {
    key: "notebooks",
    title: "Notebooks",
    icon: Icon.Notebook,
    items: notebooksMenuItems,
    multiSelect: true
  },
  {
    key: "colors",
    title: "Assign color",
    icon: Icon.Colors,
    items: colorsToMenuItems()
  },
  { key: "sep2", type: "separator" },
  {
    key: "publish",
    disabled: ({ note }) => {
      if (!db.notes.note(note.id).synced()) return notFullySyncedText;
      if (!db.monographs.isPublished(note.id) && note.locked)
        return "You cannot publish a locked note.";
    },
    icon: Icon.Publish,
    title: "Publish",
    checked: ({ note }) => db.monographs.isPublished(note.id),
    onClick: async ({ note }) => {
      const isPublished = db.monographs.isPublished(note.id);
      if (isPublished) await db.monographs.unpublish(note.id);
      else await showPublishView(note.id, "bottom");
    }
  },
  {
    key: "export",
    title: "Export as",
    icon: Icon.Export,
    disabled: ({ note }) => {
      if (!db.notes.note(note.id).synced()) return notFullySyncedText;
      if (note.locked) return "Locked notes cannot be exported currently.";
    },
    items: formats.map((format) => ({
      key: format.type,
      title: format.title,
      tooltip: `Export as ${format.title} - ${format.subtitle}`,
      icon: format.icon,
      disabled: ({ items }) =>
        format.type === "pdf" && items.length > 1
          ? "Multiple notes cannot be exported as PDF."
          : false,
      isPro: format.type !== "txt",
      onClick: async ({ items }) => {
        await exportNotes(
          format.type,
          items.map((i) => i.id)
        );
      }
    })),
    multiSelect: true,
    isPro: true
  },
  {
    key: "duplicate",
    title: "Duplicate",
    disabled: ({ note }) => {
      if (!db.notes.note(note.id).synced()) return notFullySyncedText;
      if (note.locked) return "Locked notes cannot be duplicated";
    },
    icon: Icon.Duplicate,
    onClick: async ({ note }) => {
      const id = await store.get().duplicate(note);
      if (
        await confirm({
          title: "Open duplicated note?",
          message: "Do you want to open the duplicated note?",
          negativeButtonText: "No",
          positiveButtonText: "Yes"
        })
      ) {
        hashNavigate(`/notes/${id}/edit`, { replace: true });
      }
    }
  },
  { key: "sep3", type: "separator" },
  {
    key: "local-only",
    hidden: () => !userstore.get().isLoggedIn,
    disabled: ({ note }) =>
      !db.notes.note(note.id).synced() ? notFullySyncedText : false,
    title: "Local only",
    checked: ({ note }) => note.localOnly,
    icon: ({ note }) => (note.localOnly ? Icon.Sync : Icon.SyncOff),
    onClick: async ({ note }) => {
      if (
        note.localOnly ||
        (await confirm({
          title: "Prevent this item from syncing?",
          message:
            "Turning sync off for this item will automatically delete it from all other devices & any future changes to this item won't get synced. Are you sure you want to continue?",
          positiveButtonText: "Yes",
          negativeButtonText: "No"
        }))
      )
        await store.get().localOnly(note.id);
    }
  },
  { key: "sep3", type: "separator" },
  {
    key: "movetotrash",
    title: "Move to trash",
    color: "error",
    iconColor: "error",
    icon: Icon.Trash,
    disabled: ({ items }) => {
      const areAllSynced = items.reduce((prev, curr) => {
        if (!prev || !db.notes.note(curr.id).synced()) return false;
        return prev;
      }, true);
      if (!areAllSynced) return notFullySyncedText;

      if (items.length !== 1) return false;

      if (db.monographs.isPublished(items[0].id))
        return "Please unpublish this note to move it to trash";

      if (items[0].locked)
        return "Please unlock this note to move it to trash.";
    },
    onClick: async ({ items }) => {
      await Multiselect.moveNotesToTrash(items, items.length > 1);
    },
    multiSelect: true
  }
];

function colorsToMenuItems() {
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
      }
    };
  });
}

function notebooksMenuItems({ items }) {
  const noteIds = items.map((i) => i.id);

  const menuItems = [];
  menuItems.push({
    key: "link-notebooks",
    title: "Link to...",
    icon: Icon.AddToNotebook,
    onClick: async () => {
      await showMoveNoteDialog(noteIds);
    }
  });

  const notebooks = items
    .map((note) => db.relations?.to(note, "notebook"))
    .flat();
  const topics = items.map((note) => note.notebooks || []).flat();

  if (topics?.length > 0 || notebooks?.length > 0) {
    menuItems.push(
      {
        key: "remove-from-all-notebooks",
        title: "Unlink from all",
        icon: Icon.RemoveShortcutLink,
        onClick: async () => {
          await db.notes.removeFromAllNotebooks(...noteIds);
          store.refresh();
        }
      },
      { key: "sep", type: "separator" }
    );

    notebooks?.forEach((notebook) => {
      if (menuItems.find((item) => item.key === notebook.id)) return;

      menuItems.push({
        key: notebook.id,
        title: notebook.title,
        icon: Icon.Notebook,
        checked: true,
        tooltip: "Click to remove from this notebook",
        onClick: async () => {
          await db.notes.removeFromNotebook({ id: notebook.id }, ...noteIds);
          store.refresh();
        }
      });
    });

    topics?.forEach((ref) => {
      const notebook = db.notebooks?.notebook(ref.id);
      if (!notebook) return;
      for (const topicId of ref.topics) {
        if (!notebook.topics.topic(topicId)) continue;
        if (menuItems.find((item) => item.key === topicId)) continue;

        const topic = notebook.topics.topic(topicId)._topic;
        menuItems.push({
          key: topicId,
          title: topic.title,
          icon: Icon.Topic,
          checked: true,
          tooltip: "Click to remove from this topic",
          onClick: async () => {
            await db.notes.removeFromNotebook(
              { id: ref.id, topic: topic.id },
              ...noteIds
            );
            store.refresh();
          }
        });
      }
    });
  }

  return menuItems;
}

function expiryDateMenuItems({ items }) {
  const menuItems = [];
  menuItems.push({
    key: "one-day",
    title: "A day",
    icon: Icon.Clock,
    onClick: async () => {
      await db.notes.note(items[0].id).setExpiryDate(getXDayInUnix(1));
      //db.notes.note(items[0].id).expiryDate
    }
  });

  menuItems.push({
    key: "one-week",
    title: "A Week",
    icon: Icon.Clock,
    onClick: async () => {
      await db.notes.note(items[0].id).setExpiryDate(getXDayInUnix(7));
    }
  });

  menuItems.push({
    key: "one-month",
    title: "A Month",
    icon: Icon.Clock,
    onClick: async () => {
      await db.notes.note(items[0].id).setExpiryDate(getXDayInUnix(30));
    }
  });

  menuItems.push({
    key: "one-year",
    title: "A Year",
    icon: Icon.Clock,
    onClick: async () => {
      await db.notes.note(items[0].id).setExpiryDate(getXDayInUnix(365));
    }
  });

  menuItems.push({
    key: "custom",
    title: "Custom",
    icon: Icon.Clock,
    onClick: async () => {
      await showCustomExpiryDateDialog(items[0]);
    }
  });

  return menuItems;
}

function getXDayInUnix(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.valueOf();
}
