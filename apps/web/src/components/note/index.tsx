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
import {
  Topic,
  Notebook,
  Reminder,
  Alert,
  Lock,
  Star,
  SyncOff,
  Attachment,
  AttachmentError,
  Pin,
  PDF,
  Markdown,
  HTML,
  Text as Plaintext,
  Readonly,
  StarOutline,
  AddReminder,
  Colors,
  Tag2,
  Print,
  Publish,
  Export,
  Duplicate,
  Sync,
  Trash,
  Circle,
  AddToNotebook,
  RemoveShortcutLink,
  Plus,
  Tag
} from "../icons";
import TimeAgo from "../time-ago";
import ListItem from "../list-item";
import {
  confirm,
  showAddReminderDialog,
  showAddTagsDialog,
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
  Reminder as ReminderType,
  formatReminderTime,
  isReminderActive,
  isReminderToday
} from "@notesnook/core/collections/reminders";
import { ThemeVariant } from "../theme-provider";
import { MenuItem } from "@notesnook/ui";
import {
  Context,
  Item,
  ReferencesWithDateEdited
} from "../list-container/types";
import { SchemeColors } from "@notesnook/theme";

type NoteProps = {
  tags: Item[];
  references?: ReferencesWithDateEdited;
  item: Item;
  context?: Context;
  date: number;
  reminder?: ReminderType;
  simplified?: boolean;
  compact?: boolean;
};

function Note(props: NoteProps) {
  const {
    tags,
    references,
    item,
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
  const primary: SchemeColors = !note.color
    ? "accent"
    : (note.color as string).toLowerCase();

  return (
    <ListItem
      isFocused={isOpened}
      isCompact={compact}
      isSimple={simplified}
      item={note}
      title={note.title}
      body={note.headline as string}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          const selectedItems = selectionStore
            .get()
            .selectedItems.filter((i) => i.type === item.type && i !== item);
          await Multiselect.moveNotesToTrash([item, ...selectedItems]);
        }
      }}
      colors={{
        accent: primary,
        paragraph: note.color ? primary : "heading",
        background: "background"
      }}
      menuItems={menuItems}
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
              icon={reference.type === "topic" ? Topic : Notebook}
            />
          ))}
          {reminder && isReminderActive(reminder) && (
            <IconTag
              icon={Reminder}
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
        <ThemeVariant variant="secondary">
          <Flex
            sx={{
              fontSize: "subBody",
              color: "paragraph",
              alignItems: "center"
            }}
          >
            {compact ? (
              <>
                {note.conflicted && (
                  <ThemeVariant variant="error">
                    <Alert size={15} sx={{ mr: 1 }} />
                  </ThemeVariant>
                )}
                {note.locked && (
                  <Lock size={11} sx={{ mr: 1 }} data-test-id={`locked`} />
                )}
                {note.favorite && (
                  <Star color={primary} size={15} sx={{ mr: 1 }} />
                )}
                <TimeAgo live={true} datetime={date} locale="short" />
              </>
            ) : (
              <>
                {note.conflicted && (
                  <Alert size={15} color="error" sx={{ mr: 1 }} />
                )}

                {note.localOnly && <SyncOff size={13} sx={{ mr: 1 }} />}

                <TimeAgo
                  sx={{ flexShrink: 0 }}
                  locale="en_short"
                  live={true}
                  datetime={date}
                  mr={1}
                />

                {attachments.length > 0 && (
                  <Flex mr={1}>
                    <Attachment size={13} />
                    <Text ml={"2px"} color="paragraph">
                      {attachments.length}
                    </Text>
                  </Flex>
                )}

                {failed.length > 0 && (
                  <Flex
                    mr={1}
                    title={`Errors in ${failed.length} attachments.`}
                  >
                    <AttachmentError size={13} color="error" />
                    <Text ml={"2px"}>{failed.length}</Text>
                  </Flex>
                )}

                {note.pinned && !props.context && (
                  <Pin size={13} color={primary} sx={{ mr: 1 }} />
                )}

                {note.locked && (
                  <Lock size={13} sx={{ mr: 1 }} data-test-id={`locked`} />
                )}

                {note.favorite && (
                  <Star color={primary} size={15} sx={{ mr: 1 }} />
                )}

                <ThemeVariant variant="secondary">
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
                          if (!tag.id)
                            return showToast("error", "Tag not found.");
                          navigate(`/tags/${tag.id}`);
                        }}
                        sx={{
                          maxWidth: `calc(100% / ${tags.length})`,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: "paragraph"
                        }}
                      >
                        #{tag.alias}
                      </Button>
                    );
                  })}
                </ThemeVariant>
              </>
            )}
          </Flex>
        </ThemeVariant>
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

const pin = (note: Item) => {
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
    icon: PDF,
    subtitle:
      "Can be opened in any PDF reader like Adobe Acrobat or Foxit Reader."
  },
  {
    type: "md",
    title: "Markdown",
    icon: Markdown,
    subtitle: "Can be opened in any plain-text or markdown editor."
  },
  {
    type: "html",
    title: "HTML",
    icon: HTML,
    subtitle: "Can be opened in any web browser like Google Chrome."
  },
  {
    type: "txt",
    title: "Text",
    icon: Plaintext,
    subtitle: "Can be opened in any plain-text editor."
  }
] as const;

const notFullySyncedText =
  "Cannot perform this action because note is not fully synced.";
const menuItems: (note: any, items?: any[]) => MenuItem[] = (
  note,
  items = []
) => {
  const isSynced = db.notes?.note(note.id).synced();
  const ids = items.map((i) => i.id);

  return [
    {
      type: "button",
      key: "pin",
      title: "Pin",
      isChecked: note.pinned,
      icon: Pin.path,
      onClick: () => pin(note)
    },
    {
      type: "button",
      key: "readonly",
      title: "Readonly",
      isChecked: note.readonly,
      icon: Readonly.path,
      onClick: () => store.readonly(note.id)
    },
    {
      type: "button",
      key: "favorite",
      title: "Favorite",
      isChecked: note.favorite,
      icon: StarOutline.path,
      onClick: () => store.favorite(note.id)
    },
    {
      type: "button",
      key: "lock",
      isDisabled: !isSynced,
      title: "Lock",
      isChecked: note.locked,
      icon: Lock.path,
      onClick: async () => {
        const { unlock, lock } = store.get();
        if (!note.locked) {
          await lock(note.id);
          showToast("success", "Note locked successfully!");
        } else {
          await unlock(note.id);
          showToast("success", "Note unlocked successfully!");
        }
      },
      isPro: true
    },
    {
      type: "button",
      key: "remind-me",
      title: "Remind me",
      icon: AddReminder.path,
      onClick: async () => {
        await showAddReminderDialog(note.id);
      }
    },
    { key: "sep1", type: "separator" },
    {
      type: "button",
      key: "notebooks",
      title: "Notebooks",
      icon: Notebook.path,
      menu: { items: notebooksMenuItems(items) },
      multiSelect: true
    },
    {
      type: "button",
      key: "colors",
      title: "Assign color",
      icon: Colors.path,
      menu: { items: colorsToMenuItems(note) }
    },
    {
      type: "button",
      key: "add-tags",
      title: "Tags",
      icon: Tag2.path,
      multiSelect: true,
      menu: { items: tagsMenuItems(items) }
      // onClick: async ({ items }) => {
      //   await showAddTagsDialog(items.map((i) => i.id));
      // }
    },
    { key: "sep2", type: "separator" },
    {
      type: "button",
      key: "print",
      title: "Print",
      isDisabled: !isSynced,
      icon: Print.path,
      onClick: async () => {
        await exportNotes("pdf", [note.id]);
      }
    },
    {
      type: "button",
      key: "publish",
      isDisabled:
        !isSynced || (!db.monographs?.isPublished(note.id) && note.locked),
      icon: Publish.path,
      title: "Publish",
      isChecked: db.monographs?.isPublished(note.id),
      onClick: async () => {
        const isPublished = db.monographs?.isPublished(note.id);
        if (isPublished) await db.monographs?.unpublish(note.id);
        else await showPublishView(note.id, "bottom");
      }
    },
    {
      type: "button",
      key: "export",
      title: "Export as",
      icon: Export.path,
      isDisabled: !isSynced,
      menu: {
        items: formats.map((format) => ({
          type: "button",
          key: format.type,
          title: format.title,
          tooltip: `Export as ${format.title} - ${format.subtitle}`,
          icon: format.icon.path,
          isDisabled: format.type === "pdf" && items.length > 1,
          // ? "Multiple notes cannot be exported as PDF."
          // : false,
          isPro: format.type !== "txt",
          onClick: () => exportNotes(format.type, ids)
        }))
      },
      multiSelect: true,
      isPro: true
    },
    {
      type: "button",
      key: "duplicate",
      title: "Duplicate",
      isDisabled: !isSynced || note.locked,
      icon: Duplicate.path,
      onClick: async () => {
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
    {
      type: "button",
      key: "local-only",
      isHidden: !userstore.get().isLoggedIn,
      isDisabled: !isSynced,
      title: "Local only",
      isChecked: note.localOnly,
      icon: note.localOnly ? Sync.path : SyncOff.path,
      onClick: async () => {
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
      type: "button",
      key: "movetotrash",
      title: "Move to trash",
      styles: { icon: { color: "red" }, text: { color: "red" } },
      icon: Trash.path,
      isDisabled:
        items.length === 1
          ? db.monographs?.isPublished(note.id) || note.locked
          : items.some((item) => !db.notes?.note(item.id).synced()),
      onClick: () => Multiselect.moveNotesToTrash(items, items.length > 1),
      multiSelect: true
    }
  ];
};

function colorsToMenuItems(note: any): MenuItem[] {
  return COLORS.map((label) => {
    const lowercase = label.toLowerCase();
    return {
      type: "button",
      key: lowercase,
      title: db.colors?.alias(lowercase) || label,
      icon: Circle.path,
      styles: { icon: { color: lowercase } },
      isChecked: note.color === lowercase,
      onClick: () => store.setColor(note.id, lowercase)
    };
  });
}

function notebooksMenuItems(items: any[]): MenuItem[] {
  const noteIds = items.map((i) => i.id);

  const menuItems: MenuItem[] = [];
  menuItems.push({
    type: "button",
    key: "link-notebooks",
    title: "Link to...",
    icon: AddToNotebook.path,
    onClick: () => showMoveNoteDialog(noteIds)
  });

  const notebooks = items
    .map((note) => db.relations?.to(note, "notebook"))
    .flat();
  const topics = items.map((note) => note.notebooks || []).flat();

  if (topics?.length > 0 || notebooks?.length > 0) {
    menuItems.push(
      {
        type: "button",
        key: "remove-from-all-notebooks",
        title: "Unlink from all",
        icon: RemoveShortcutLink.path,
        onClick: async () => {
          await db.notes?.removeFromAllNotebooks(...noteIds);
          store.refresh();
        }
      },
      { key: "sep", type: "separator" }
    );

    notebooks?.forEach((notebook) => {
      if (!notebook || menuItems.find((item) => item.key === notebook.id))
        return;

      menuItems.push({
        type: "button",
        key: notebook.id,
        title: db.notebooks?.notebook(notebook.id).title,
        icon: Notebook.path,
        isChecked: true,
        tooltip: "Click to remove from this notebook",
        onClick: async () => {
          await db.notes?.removeFromNotebook({ id: notebook.id }, ...noteIds);
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
          type: "button",
          key: topicId,
          title: topic.title,
          icon: Topic.path,
          isChecked: true,
          tooltip: "Click to remove from this topic",
          onClick: async () => {
            await db.notes?.removeFromNotebook(
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

function tagsMenuItems(items: any[]): MenuItem[] {
  const noteIds = items.map((i) => i.id);

  const menuItems: MenuItem[] = [];
  menuItems.push({
    type: "button",
    key: "assign-tags",
    title: "Assign to...",
    icon: Plus.path,
    onClick: async () => {
      await showAddTagsDialog(noteIds);
    }
  });

  const tags = items.map((note) => note.tags).flat();

  if (tags?.length > 0) {
    menuItems.push(
      {
        type: "button",
        key: "remove-from-all-tags",
        title: "Remove from all",
        icon: RemoveShortcutLink.path,
        onClick: async () => {
          for (const note of items) {
            for (const tag of tags) {
              if (!note.tags.includes(tag)) continue;
              await db.notes?.note(note).untag(tag);
            }
          }
          store.refresh();
        }
      },
      { key: "sep", type: "separator" }
    );

    tags?.forEach((tag) => {
      if (menuItems.find((item) => item.key === tag)) return;

      menuItems.push({
        type: "button",
        key: tag,
        title: db.tags?.alias(tag),
        icon: Tag.path,
        isChecked: true,
        tooltip: "Click to remove from this tag",
        onClick: async () => {
          for (const note of items) {
            if (!note.tags.includes(tag)) continue;
            await db.notes?.note(note).untag(tag);
          }
          store.refresh();
        }
      });
    });
  }

  return menuItems;
}
