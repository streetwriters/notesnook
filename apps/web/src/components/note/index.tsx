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

import React from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import {
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
  Copy,
  Tag as TagIcon
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
import { useEditorStore } from "../../stores/editor-store";
import { store as tagStore } from "../../stores/tag-store";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { navigate } from "../../navigation";
import { showPublishView } from "../publish-view";
import IconTag from "../icon-tag";
import { COLORS } from "../../common/constants";
import { exportNotes } from "../../common/export";
import { Multiselect } from "../../common/multi-select";
import { store as selectionStore } from "../../stores/selection-store";
import {
  isReminderActive,
  isReminderToday
} from "@notesnook/core/dist/collections/reminders";
import { getFormattedReminderTime, pluralize } from "@notesnook/common";
import {
  Reminder as ReminderType,
  Color,
  Note,
  Notebook as NotebookItem,
  Tag,
  DefaultColors
} from "@notesnook/core";
import { MenuItem } from "@notesnook/ui";
import {
  Context,
  NotebooksWithDateEdited,
  TagsWithDateEdited
} from "../list-container/types";
import { SchemeColors } from "@notesnook/theme";
import Vault from "../../common/vault";

type NoteProps = {
  tags?: TagsWithDateEdited;
  color?: Color;
  notebooks?: NotebooksWithDateEdited;
  item: Note;
  context?: Context;
  date: number;
  reminder?: ReminderType;
  simplified?: boolean;
  compact?: boolean;
};

function Note(props: NoteProps) {
  const {
    tags,
    color,
    notebooks,
    item,
    date,
    reminder,
    simplified,
    compact,
    context
  } = props;
  const note = item;

  const isOpened = useEditorStore((store) => store.activeSessionId === item.id);
  const attachments = [];

  // useAttachmentStore((store) =>
  //   store.attachments.filter((a) => a.noteIds.includes(note.id))
  // );
  const failed = [];

  // useMemo(
  //   () => attachments.filter((a) => a.failed),
  //   [attachments]
  // );
  const primary: SchemeColors = color ? color.colorCode : "accent-selected";

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
          // @ts-expect-error write tests for this
          const selectedItems = selectionStore.get().selectedItems;
          await Multiselect.moveNotesToTrash([item.id, ...selectedItems]);
        }
      }}
      colors={{
        accent: primary,
        heading: color ? primary : "heading",
        background: "background"
      }}
      context={{ color }}
      menuItems={menuItems}
      onClick={() => {
        // if (note.conflicted) {
        //   hashNavigate(`/notes/${note.id}/conflict`, { replace: true });
        // } else if (note.locked) {
        //  openLockedSession(note)
        //   // hashNavigate(`/notes/${note.id}/unlock`, { replace: true });
        // } else {
        useEditorStore.getState().openSession(note);
        // hashNavigate(`/notes/${note.id}/edit`, { replace: true });
        //  }
      }}
      header={
        <Flex
          sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, mt: "small" }}
        >
          {context?.type !== "notebook" &&
            notebooks?.items.map((notebook) => (
              <IconTag
                key={notebook.id}
                onClick={() => {
                  navigate(`/notebooks/${notebook.id}`);
                }}
                text={notebook.title}
                icon={Notebook}
              />
            ))}
          {reminder && isReminderActive(reminder) ? (
            <IconTag
              icon={Reminder}
              text={getFormattedReminderTime(reminder, true)}
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
          ) : null}
        </Flex>
      }
      footer={
        <Flex
          sx={{
            fontSize: "subBody",
            color: "paragraph-secondary",
            alignItems: "center",
            gap: 1
          }}
        >
          {compact ? (
            <>
              {note.conflicted && <Alert size={15} color="var(--icon-error)" />}
              {note.locked && <Lock size={11} data-test-id={`locked`} />}
              {note.favorite && <Star color={primary} size={15} />}
              <TimeAgo live={true} datetime={date} locale="short" />
            </>
          ) : (
            <>
              {note.conflicted && <Alert size={15} color="icon-error" />}

              {note.localOnly && <SyncOff size={13} />}

              <TimeAgo
                sx={{ flexShrink: 0 }}
                locale="en_short"
                live={true}
                datetime={date}
              />

              {attachments.length > 0 && (
                <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
                  <Attachment size={13} />
                  <Text variant="subBody" ml={"2px"}>
                    {attachments.length}
                  </Text>
                </Flex>
              )}

              {failed.length > 0 && (
                <Flex title={`Errors in ${failed.length} attachments.`}>
                  <AttachmentError size={13} color="var(--icon-error)" />
                  <Text ml={"2px"}>{failed.length}</Text>
                </Flex>
              )}

              {note.pinned && !props.context && (
                <Pin size={13} color={primary} />
              )}

              {note.locked && <Lock size={13} data-test-id={`locked`} />}

              {note.favorite && <Star color={primary} size={15} />}

              {tags?.items.map((tag) => {
                return (
                  <Button
                    data-test-id={`tag-item`}
                    key={tag.id}
                    variant="anchor"
                    title={`Go to #${tag.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!tag.id) return showToast("error", "Tag not found.");
                      navigate(`/tags/${tag.id}`);
                    }}
                    sx={{
                      maxWidth: `calc(100% / ${tags.items.length})`,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "var(--paragraph-secondary)"
                    }}
                  >
                    #{tag.title}
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
    prevItem.dateModified === nextItem.dateModified &&
    prevProps.notebooks?.dateEdited === nextProps.notebooks?.dateEdited &&
    prevProps.tags?.dateEdited === nextProps.tags?.dateEdited &&
    prevProps.reminder?.dateModified === nextProps.reminder?.dateModified
  );
});

// const pin = (note: Note) => {
//   return store
//     .pin(note.id);
// };

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
    type: "md-frontmatter",
    title: "Markdown + Frontmatter",
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
const menuItems: (
  note: Note,
  ids?: string[],
  context?: { color?: Color }
) => MenuItem[] = (note, ids = [], context) => {
  // const isSynced = db.notes.note(note.id)?.synced();

  return [
    {
      type: "button",
      key: "pin",
      title: "Pin",
      isChecked: note.pinned,
      icon: Pin.path,
      onClick: () => store.pin(!note.pinned, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "readonly",
      title: "Readonly",
      isChecked: note.readonly,
      icon: Readonly.path,
      onClick: () => store.readonly(!note.readonly, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "favorite",
      title: "Favorite",
      isChecked: note.favorite,
      icon: StarOutline.path,
      onClick: () => store.favorite(!note.favorite, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "lock",
      //isDisabled: !isSynced,
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
      menu: { items: notebooksMenuItems(ids) },
      multiSelect: true
    },
    {
      type: "button",
      key: "colors",
      title: "Assign color",
      icon: Colors.path,
      multiSelect: true,
      menu: { items: colorsToMenuItems(context?.color, ids) }
    },
    {
      type: "button",
      key: "add-tags",
      title: "Tags",
      icon: Tag2.path,
      multiSelect: true,
      menu: { items: tagsMenuItems(ids) }
    },
    { key: "sep2", type: "separator" },
    {
      type: "button",
      key: "print",
      title: "Print",
      //isDisabled: !isSynced,
      icon: Print.path,
      onClick: async () => {
        await exportNotes("pdf", [note.id]);
      }
    },
    {
      type: "button",
      key: "publish",
      isDisabled:
        //!isSynced ||
        !db.monographs.isPublished(note.id) && note.locked,
      icon: Publish.path,
      title: "Publish",
      isChecked: db.monographs.isPublished(note.id),
      onClick: async () => {
        const isPublished = db.monographs.isPublished(note.id);
        if (isPublished) await db.monographs.unpublish(note.id);
        else await showPublishView(note.id, "bottom");
      }
    },
    {
      type: "button",
      key: "export",
      title: "Export as",
      icon: Export.path,
      //isDisabled: !isSynced,
      menu: {
        items: formats.map((format) => ({
          type: "button",
          key: format.type,
          title: format.title,
          tooltip: `Export as ${format.title} - ${format.subtitle}`,
          icon: format.icon.path,
          isDisabled: format.type === "pdf" && ids.length > 1,
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
      key: "copy",
      title: "Copy as",
      icon: Copy.path,
      menu: {
        items: [
          {
            type: "button",
            key: "copy-as-text",
            tooltip: `Copy as Text`,
            title: "Text",
            icon: Plaintext.path,
            onClick: () => copyNote(note.id, "txt")
          },
          {
            type: "button",
            key: "copy-as-markdown",
            tooltip: `Copy as Markdown`,
            title: "Markdown",
            icon: Markdown.path,
            onClick: () => copyNote(note.id, "md")
          }
        ]
      }
    },
    {
      type: "button",
      key: "duplicate",
      title: "Duplicate",
      //!isSynced ||
      isDisabled: note.locked,
      icon: Duplicate.path,
      onClick: () => store.get().duplicate(...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "local-only",
      isHidden: !userstore.get().isLoggedIn,
      //isDisabled: !isSynced,
      title: "Local only",
      isChecked: note.localOnly,
      icon: note.localOnly ? Sync.path : SyncOff.path,
      onClick: async () => {
        if (
          note.localOnly ||
          (await confirm({
            title: `Prevent ${pluralize(ids.length, "note")} from syncing?`,
            message: `${pluralize(
              ids.length,
              "note"
            )} will be automatically deleted from all other devices & any future changes won't get synced. Are you sure you want to continue?`,
            positiveButtonText: "Yes",
            negativeButtonText: "No"
          }))
        )
          await store.localOnly(!note.localOnly, ...ids);
      },
      multiSelect: true
    },
    { key: "sep3", type: "separator" },
    {
      type: "button",
      key: "movetotrash",
      title: "Move to trash",
      variant: "dangerous",
      icon: Trash.path,
      isDisabled:
        ids.length === 1 && (db.monographs.isPublished(note.id) || note.locked),
      onClick: () => Multiselect.moveNotesToTrash(ids, ids.length > 1),
      multiSelect: true
    }
  ];
};

function colorsToMenuItems(
  noteColor: Color | undefined,
  ids: string[]
): MenuItem[] {
  return COLORS.map((color) => {
    const isChecked = !!noteColor && noteColor.title === color.title;
    return {
      type: "button",
      key: color.key,
      title: color.title,
      icon: Circle.path,
      styles: { icon: { color: DefaultColors[color.key] } },
      isChecked,
      onClick: () => store.setColor(color, isChecked, ...ids)
    } satisfies MenuItem;
  });
}

function notebooksMenuItems(ids: string[]): MenuItem[] {
  return [
    {
      type: "button",
      key: "link-notebooks",
      title: "Link to...",
      icon: AddToNotebook.path,
      onClick: () => showMoveNoteDialog(ids)
    },
    {
      type: "lazy-loader",
      key: "notebooks-lazy-loader",
      async items() {
        const notebooks: Map<string, NotebookItem> = new Map();
        const notebookShortcuts: Map<string, NotebookItem> = new Map();

        const linkedNotebooks = await db.relations
          .to({ ids, type: "note" }, "notebook")
          .resolve();
        linkedNotebooks.forEach((nb) => notebooks.set(nb.id, nb));

        for (const notebook of await db.shortcuts.resolved("notebooks")) {
          if (notebooks.has(notebook.id)) continue;
          notebookShortcuts.set(notebook.id, notebook);
        }

        const menuItems: MenuItem[] = [];
        if (notebooks.size > 0)
          menuItems.push(
            {
              type: "button",
              key: "remove-from-all-notebooks",
              title: "Unlink from all",
              icon: RemoveShortcutLink.path,
              onClick: async () => {
                await db.notes.removeFromAllNotebooks(...ids);
                store.refresh();
              }
            },
            { key: "sep", type: "separator" }
          );

        if (notebookShortcuts.size > 0) {
          menuItems.push({ key: "sep3", type: "separator" });
          notebookShortcuts.forEach((notebook) => {
            menuItems.push({
              type: "button",
              key: notebook.id,
              title: notebook.title,
              icon: Notebook.path,
              isChecked: false,
              onClick: async () => {
                await db.notes.addToNotebook(notebook.id, ...ids);
                store.refresh();
              }
            });
          });

          if (notebooks.size > 0)
            menuItems.push({ key: "sep2", type: "separator" });
        }

        notebooks.forEach((notebook) => {
          menuItems.push({
            type: "button",
            key: notebook.id,
            title: notebook.title,
            icon: Notebook.path,
            isChecked: true,
            onClick: async () => {
              await db.notes.removeFromNotebook(notebook.id, ...ids);
              store.refresh();
            }
          });
        });
        return menuItems;
      }
    }
  ];
}

function tagsMenuItems(ids: string[]): MenuItem[] {
  return [
    {
      type: "button",
      key: "assign-tags",
      title: "Assign to...",
      icon: Plus.path,
      onClick: () => showAddTagsDialog(ids)
    },
    {
      type: "lazy-loader",
      key: "tags-lazy-loader",
      async items() {
        const tags: Map<string, Tag> = new Map();
        const tagShortcuts: Map<string, Tag> = new Map();

        const linkedTags = await db.relations
          .to({ ids, type: "note" }, "tag")
          .resolve();
        linkedTags.forEach((tag) => tags.set(tag.id, tag));

        for (const tag of await db.shortcuts.resolved("tags")) {
          if (tags.has(tag.id)) continue;
          tagShortcuts.set(tag.id, tag);
        }

        const menuItems: MenuItem[] = [];
        if (tags.size > 0)
          menuItems.push(
            {
              type: "button",
              key: "remove-from-all-tags",
              title: "Remove from all",
              icon: RemoveShortcutLink.path,
              onClick: async () => {
                for (const id of ids) {
                  await db.relations.to({ id, type: "note" }, "tag").unlink();
                }
                tagStore.get().refresh();
                await useEditorStore.getState().refreshTags();
                await store.get().refresh();
              }
            },
            { key: "sep", type: "separator" }
          );

        if (tagShortcuts.size > 0) {
          menuItems.push({ key: "sep3", type: "separator" });
          tagShortcuts.forEach((tag) => {
            menuItems.push({
              type: "button",
              key: tag.id,
              title: tag.title,
              icon: TagIcon.path,
              isChecked: false,
              onClick: async () => {
                for (const id of ids) {
                  await db.relations.add(tag, { id, type: "note" });
                }
                await tagStore.get().refresh();
                await useEditorStore.getState().refreshTags();
                await store.get().refresh();
              }
            });
          });

          if (tags.size > 0) menuItems.push({ key: "sep2", type: "separator" });
        }

        tags.forEach((tag) => {
          menuItems.push({
            type: "button",
            key: tag.id,
            title: tag.title,
            icon: TagIcon.path,
            isChecked: true,
            onClick: async () => {
              for (const id of ids) {
                await db.relations.unlink(tag, { id, type: "note" });
              }
              await tagStore.get().refresh();
              await useEditorStore.getState().refreshTags();
              await store.get().refresh();
            }
          });
        });
        return menuItems;
      }
    }
  ];
}

async function copyNote(noteId: string, format: "md" | "txt") {
  try {
    const note = await db.notes?.note(noteId);
    if (!note) throw new Error("No note with this id exists.");
    if (note.locked && !(await Vault.unlockVault()))
      throw new Error("Please unlock this note to copy it.");

    const rawContent = note.contentId && (await db.content.get(note.contentId));
    if (!rawContent) throw new Error("This note has no content.");

    const content = rawContent.locked
      ? await db.vault?.decryptContent(rawContent, noteId)
      : rawContent;

    const text = await db.notes.export(noteId, {
      format,
      contentItem: content,
      disableTemplate: true
    });
    if (!text) throw new Error(`Could not convert note to ${format}.`);
    await navigator.clipboard.writeText(text);
    showToast("success", "Copied!");
  } catch (e) {
    if (e instanceof Error)
      showToast("error", `Failed to copy note: ${e.message}.`);
  }
}
