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

import {
  NoteResolvedData,
  areFeaturesAvailable,
  exportContent,
  formatDate,
  getFormattedReminderTime
} from "@notesnook/common";
import {
  Color,
  Note as NoteType,
  Notebook as NotebookItem,
  Tag as TagType,
  createInternalLink,
  hosts,
  isReminderActive,
  isReminderToday
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { SchemeColors, Theme } from "@notesnook/theme";
import { MenuItem } from "@notesnook/ui";
import { alpha } from "@theme-ui/color";
import { useThemeUI } from "@theme-ui/core";
import { Flex, Text } from "@theme-ui/components";
import React from "react";
import { db } from "../../common/db";
import { exportNote, exportNotes } from "../../common/export";
import { Multiselect } from "../../common/multi-select";
import Vault from "../../common/vault";
import { AddReminderDialog } from "../../dialogs/add-reminder-dialog";
import { AddTagsDialog } from "../../dialogs/add-tags-dialog";
import { ConfirmDialog } from "../../dialogs/confirm";
import { CreateColorDialog } from "../../dialogs/create-color-dialog";
import { MoveNoteDialog } from "../../dialogs/move-note-dialog";
import { navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { store } from "../../stores/note-store";
import { store as selectionStore } from "../../stores/selection-store";
import { store as tagStore } from "../../stores/tag-store";
import { store as userstore } from "../../stores/user-store";
import { store as appStore } from "../../stores/app-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { writeToClipboard } from "../../utils/clipboard";
import { showToast } from "../../utils/toast";
import {
  AddReminder,
  AddToNotebook,
  Alert,
  Archive,
  AttachmentError,
  NoteBell,
  Circle,
  Close,
  Colors,
  Copy,
  Destruct,
  Duplicate,
  Edit,
  Export,
  HTML,
  InternalLink,
  Lock,
  Markdown,
  Notebook,
  OpenInNew,
  PDF,
  Pin,
  Text as Plaintext,
  Plus,
  Print,
  Publish,
  Readonly,
  RemoveShortcutLink,
  StarOutline,
  Sync,
  SyncOff,
  Tag2,
  Tag as TagIcon,
  NoteCalendar,
  NoteExpiry,
  NoteFavorite,
  NoteLink,
  NoteLock,
  NotePin,
  NoteReadonly,
  Trash,
  Update
} from "../icons";
import { Context } from "../list-container/types";
import IconTag from "../icon-tag";
import ListItem from "../list-item";
import { PublishDialog } from "../publish-view";
import TimeAgo from "../time-ago";
import { NoteExpiryDateDialog } from "../../dialogs/note-expiry-date-dialog";
import { withFeatureCheck } from "../../common";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { useTheme } from "@emotion/react";

type NoteProps = NoteResolvedData & {
  item: NoteType;
  context?: Context;
  date: number;
  compact?: boolean;
};

function Note(props: NoteProps) {
  const {
    tags,
    color,
    notebooks,
    attachments,
    locked,
    item,
    date,
    reminder,
    compact,
    context
  } = props;
  const note = item;
  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));
  const primary: SchemeColors = color ? color.colorCode : "accent-selected";
  const dateFormat = useSettingStore((store) => store.dateFormat);
  const isSelected = useSelectionStore((store) =>
    store.selectedItems.includes(item.id)
  );
  const metadataItems = compact
    ? []
    : getMetadataItems({
        note,
        context,
        locked,
        attachments,
        notebooks,
        tags,
        reminder,
        primary,
        isSelected: isSelected || isOpened
      });
  const hasMetadata = metadataItems.length > 0;

  return (
    <ListItem
      draggable={true}
      isFocused={isOpened}
      isCompact={compact}
      item={note}
      title={
        <Flex
          sx={{
            alignItems: "center",
            gap: "spacing3",
            minWidth: 0
          }}
        >
          {color && (
            <Circle size={10} color={primary} sx={{ width: 10, height: 10 }} />
          )}
          <Text
            dir="auto"
            data-test-id={`title`}
            sx={{
              color: "heading",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: compact ? "xs" : "sm"
            }}
          >
            {note.title}
          </Text>
        </Flex>
      }
      body={!compact && note.headline ? note.headline : undefined}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          // @ts-expect-error write tests for this
          await Multiselect.moveNotesToTrash(
            selectionStore.get().selectedItems
          );
        }
      }}
      colors={{
        accent: primary,
        heading: color ? primary : "heading",
        background: "background",
        // @ts-ignore alpha(primary, 0,1) is not a theme color
        backgroundSelected: color ? alpha(primary, 0.1) : "background-secondary"
      }}
      sx={{
        py: "spacing4",
        px: "spacing6",
        pl: (t) => (t as Theme).space?.["spacing6"] - 2,
        height: compact ? "auto" : undefined,
        borderBottom: "1px solid",
        borderLeft: "2px solid",
        borderLeftColor: isOpened ? primary : "transparent",
        borderBottomColor: "border",
        gap: "spacing4",
        ":hover": {
          ".note-chip": { backgroundColor: "background-tertiary" }
        }
      }}
      context={{ color, locked }}
      menuItems={noteMenuItems}
      onClick={() => useEditorStore.getState().openSession(note)}
      onMiddleClick={() =>
        useEditorStore.getState().openSession(note, { openInNewTab: true })
      }
      header={
        compact || !hasMetadata ? undefined : (
          <Flex
            sx={{
              alignItems: "center",
              flexWrap: "wrap",
              gap: "spacing2",
              minWidth: 0
            }}
          >
            {metadataItems}
          </Flex>
        )
      }
      footer={
        <Flex
          sx={{
            alignItems: "center",
            color: "paragraph-secondary",
            flexShrink: 0,
            gap: "spacing2",
            justifyContent: compact ? "flex-end" : undefined
          }}
        >
          {compact ? (
            <>
              <TimeAgo
                sx={{
                  color: "paragraph-secondary",
                  fontSize: "xxs",
                  fontWeight: "medium",
                  whiteSpace: "nowrap"
                }}
                live={true}
                datetime={date}
                locale="short"
              />
              {note.conflicted && <Alert size={11} color="icon-error" />}
              {locked && (
                <NoteLock
                  size={11}
                  color="icon-secondary"
                  data-test-id="locked"
                />
              )}
              {note.readonly && (
                <NoteReadonly size={11} color="icon-secondary" />
              )}
              {note.favorite && (
                <NoteFavorite
                  data-test-id="favorite"
                  size={11}
                  color="#E5C131"
                />
              )}
              {note.expiryDate?.value ? (
                <NoteExpiry size={11} color="paragraph-secondary" />
              ) : null}
            </>
          ) : (
            <>
              <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
                <NoteCalendar size={12} color="icon-secondary" />
                <Text
                  sx={{
                    color: "paragraph-secondary",
                    fontSize: "xxs",
                    fontWeight: "medium"
                  }}
                >
                  {formatDate(date, { type: "date", dateFormat })}
                </Text>
              </Flex>
              {note.expiryDate?.value && (
                <IconTag
                  className="note-chip"
                  icon={NoteExpiry}
                  selected={isSelected || isOpened}
                  text={formatDate(note.expiryDate.value, {
                    type: "date",
                    dateFormat
                  })}
                  iconSize={12}
                  styles={{
                    icon: { color: "icon-secondary" },
                    text: { color: "paragraph-secondary" }
                  }}
                />
              )}
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
    prevProps.compact === nextProps.compact &&
    prevProps.date === nextProps.date &&
    prevItem.dateModified === nextItem.dateModified &&
    prevProps.notebooks?.dateEdited === nextProps.notebooks?.dateEdited &&
    prevProps.tags?.dateEdited === nextProps.tags?.dateEdited &&
    prevProps.reminder?.dateModified === nextProps.reminder?.dateModified &&
    prevProps.attachments?.failed === nextProps.attachments?.failed &&
    prevProps.attachments?.total === nextProps.attachments?.total &&
    prevProps.locked === nextProps.locked &&
    prevProps.color?.id === nextProps.color?.id &&
    prevItem.expiryDate?.value === nextItem.expiryDate?.value
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
    icon: PDF
  },
  {
    type: "md",
    title: "Markdown",
    icon: Markdown
  },
  {
    type: "md-frontmatter",
    title: "Markdown + Frontmatter",
    icon: Markdown
  },
  {
    type: "html",
    title: "HTML",
    icon: HTML
  },
  {
    type: "txt",
    title: "Text",
    icon: Plaintext
  }
] as const;

export const noteMenuItems: (
  note: NoteType,
  ids?: string[],
  context?: { color?: Color; locked?: boolean }
) => Promise<MenuItem[]> = async (note, ids = [], context) => {
  // const isSynced = db.notes.note(note.id)?.synced();
  const features = await areFeaturesAvailable(["expiringNotes"]);
  return [
    {
      type: "button",
      key: "openinnewtab",
      title: strings.openInNewTab(),
      icon: OpenInNew.path,
      onClick: () =>
        useEditorStore.getState().openSession(note.id, { openInNewTab: true })
    },
    {
      type: "button",
      key: "pin",
      title: strings.pin(),
      isChecked: note.pinned,
      icon: Pin.path,
      onClick: () => store.pin(!note.pinned, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "readonly",
      title: strings.readOnly(),
      isChecked: note.readonly,
      icon: Readonly.path,
      onClick: () => store.readonly(!note.readonly, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "favorite",
      title: strings.favorite(),
      isChecked: note.favorite,
      icon: StarOutline.path,
      onClick: () => store.favorite(!note.favorite, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "lock",
      //isDisabled: !isSynced,
      title: strings.lock(),
      isChecked: context?.locked,
      icon: Lock.path,
      onClick: async () => {
        const { unlock, lock } = store.get();
        if (!context?.locked) {
          if (await lock(note.id)) showToast("success", strings.noteLocked());
        } else if (await unlock(note.id)) {
          showToast("success", strings.noteUnlocked());
        }
      }
    },
    {
      type: "button",
      key: "remind-me",
      title: strings.remindMe(),
      icon: AddReminder.path,
      onClick: async () => {
        await AddReminderDialog.show({ note });
      }
    },
    {
      type: "button",
      key: "archive",
      title: strings.archive(),
      isChecked: note.archived,
      icon: Archive.path,
      onClick: () => store.archive(!note.archived, ...ids),
      multiSelect: true
    },
    { key: "sep1", type: "separator" },
    {
      type: "button",
      key: "notebooks",
      title: strings.notebooks(),
      icon: Notebook.path,
      menu: { items: notebooksMenuItems(ids) },
      multiSelect: true
    },
    {
      type: "button",
      key: "colors",
      title: strings.assignColor(),
      icon: Colors.path,
      multiSelect: true,
      menu: { items: colorsToMenuItems(context?.color, ids) }
    },
    {
      type: "button",
      key: "add-tags",
      title: strings.dataTypesPluralCamelCase.tag(),
      icon: Tag2.path,
      multiSelect: true,
      menu: { items: tagsMenuItems(ids) }
    },
    { key: "sep2", type: "separator" },
    {
      type: "button",
      key: "print",
      title: strings.print(),
      //isDisabled: !isSynced,
      icon: Print.path,
      onClick: async () => {
        await exportNote(note, {
          format: "pdf"
        });
      }
    },
    {
      type: "button",
      key: "publish",
      isDisabled: !db.monographs.isPublished(note.id) && context?.locked,
      icon: Publish.path,
      title: strings.publish(),
      menu: db.monographs.isPublished(note.id)
        ? {
            items: [
              {
                type: "button",
                key: "open",
                title: strings.open(),
                icon: OpenInNew.path,
                onClick: async () => {
                  const url = `${hosts.MONOGRAPH_HOST}/${note.id}`;
                  window.open(url, "_blank");
                }
              },
              {
                type: "button",
                key: "copy-link",
                title: strings.copyLink(),
                icon: Copy.path,
                onClick: async () => {
                  const url = `${hosts.MONOGRAPH_HOST}/${note.id}`;
                  await writeToClipboard({
                    "text/plain": url,
                    "text/html": `<a href="${url}">${note.title}</a>`,
                    "text/markdown": `[${note.title}](${url})`
                  });
                  showToast("success", strings.linkCopied());
                }
              },
              {
                type: "button",
                key: "update",
                title: strings.update(),
                icon: Update.path,
                onClick: () => {
                  PublishDialog.show({ note });
                }
              },
              {
                type: "separator",
                key: "sep"
              },
              {
                type: "button",
                key: "unpublish",
                title: strings.unpublish(),
                icon: Publish.path,
                onClick: async () => {
                  await useMonographStore.getState().unpublish(note.id);
                }
              }
            ]
          }
        : undefined,
      onClick: () => PublishDialog.show({ note })
    },
    {
      type: "button",
      key: "export",
      title: strings.exportAs(),
      icon: Export.path,
      //isDisabled: !isSynced,
      menu: {
        items: formats.map((format) => ({
          type: "button",
          key: format.type,
          title: format.title,
          tooltip: strings.exportAs(format.title),
          icon: format.icon.path,
          isDisabled: format.type === "pdf" && ids.length > 1,
          multiSelect: true,
          onClick: async () => {
            if (ids.length === 1) {
              return await exportNote(note, {
                format: format.type
              });
            }

            await exportNotes(
              format.type,
              db.notes.all.where((eb) => eb("id", "in", ids))
            );
          }
        }))
      },
      multiSelect: true
    },
    {
      type: "button",
      key: "copy",
      title: strings.copyAs(),
      icon: Copy.path,
      menu: {
        items: [
          {
            type: "button",
            key: "copy-as-text",
            tooltip: strings.copyAs("Text"),
            title: "Text",
            icon: Plaintext.path,
            onClick: () => copyNote(note.id, "txt")
          },
          {
            type: "button",
            key: "copy-as-markdown",
            tooltip: strings.copyAs("Markdown"),
            title: "Markdown",
            icon: Markdown.path,
            onClick: () => copyNote(note.id, "md")
          }
        ]
      }
    },
    {
      type: "button",
      key: "copy-link",
      title: strings.copyLink(),
      icon: InternalLink.path,
      onClick: () => {
        const link = createInternalLink("note", note.id);
        writeToClipboard({
          "text/plain": link,
          "text/html": `<a href="${link}">${note.title}</a>`,
          "text/markdown": `[${note.title}](${link})`
        });
        showToast("success", strings.linkCopied());
      }
    },
    {
      type: "button",
      key: "duplicate",
      title: strings.duplicate(),
      icon: Duplicate.path,
      onClick: () => store.get().duplicate(...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "local-only",
      isHidden: !userstore.get().isLoggedIn,
      //isDisabled: !isSynced,
      title: strings.syncOff(),
      isChecked: note.localOnly,
      icon: note.localOnly ? Sync.path : SyncOff.path,
      onClick: async () => {
        if (
          note.localOnly ||
          (await ConfirmDialog.show({
            title: strings.syncOffConfirm(ids.length),
            message: strings.syncOffDesc(ids.length),
            positiveButtonText: strings.yes(),
            negativeButtonText: strings.no()
          }))
        )
          await store.localOnly(!note.localOnly, ...ids);
      },
      multiSelect: true
    },
    { key: "sep3", type: "separator" },
    note.expiryDate?.value
      ? {
          type: "button",
          key: "expiry-date",
          title: strings.expiryDate(),
          icon: Destruct.path,
          menu: {
            items: [
              {
                type: "button",
                key: "change",
                title: strings.change(),
                onClick: async () => {
                  await NoteExpiryDateDialog.show({
                    noteId: note.id,
                    expiryDate: note.expiryDate?.value
                  });
                },
                icon: Edit.path
              },
              {
                type: "button",
                key: "remove",
                title: strings.remove(),
                onClick: async () => {
                  await db.notes.setExpiryDate(null, ...ids);
                  store.refresh();
                  showToast("success", "Expiry date removed");
                },
                icon: Close.path
              }
            ]
          }
        }
      : {
          type: "button",
          key: "expiry-date",
          title: strings.setExpiry(),
          icon: Destruct.path,
          premium: !features.expiringNotes.isAllowed,
          onClick: withFeatureCheck(features.expiringNotes, async () => {
            await NoteExpiryDateDialog.show({
              noteId: note.id
            });
          })
        },
    {
      type: "button",
      key: "movetotrash",
      title: strings.moveToTrash(),
      variant: "dangerous",
      icon: Trash.path,
      isDisabled: ids.length === 1 && db.monographs.isPublished(note.id),
      onClick: () => Multiselect.moveNotesToTrash(ids, ids.length > 1),
      multiSelect: true
    }
  ];
};

function colorsToMenuItems(
  noteColor: Color | undefined,
  ids: string[]
): MenuItem[] {
  return [
    {
      key: "new-color",
      type: "button",
      title: strings.addColor(),
      icon: Plus.path,
      onClick: async () => {
        const id = await CreateColorDialog.show({});
        if (!id) return;
        await store.get().setColor(id, noteColor?.id === id, ...ids);
      }
    },
    {
      key: "colors",
      type: "lazy-loader",
      async items() {
        const colors = await db.colors.all.items();
        const menuItems: MenuItem[] = [];
        if (colors.length > 0)
          menuItems.push({ type: "separator", key: "sep" });
        menuItems.push(
          ...colors.map((color) => {
            const isChecked = !!noteColor && noteColor.id === color.id;
            return {
              type: "button",
              key: color.id,
              title: color.title,
              icon: Circle.path,
              styles: { icon: { color: color.colorCode } },
              isChecked,
              onClick: () => store.setColor(color.id, isChecked, ...ids)
            } satisfies MenuItem;
          })
        );
        return menuItems;
      }
    }
  ];
}

function notebooksMenuItems(ids: string[]): MenuItem[] {
  return [
    {
      type: "button",
      key: "link-notebooks",
      title: strings.linkNotebooks(),
      icon: AddToNotebook.path,
      onClick: () => MoveNoteDialog.show({ noteIds: ids })
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
          menuItems.push({
            type: "button",
            key: "remove-from-all-notebooks",
            title: strings.unlinkFromAll(),
            icon: RemoveShortcutLink.path,
            onClick: async () => {
              await db.notes.removeFromAllNotebooks(...ids);
              store.refresh();
            }
          });

        if (notebookShortcuts.size > 0 || notebooks.size > 0)
          menuItems.push({ key: "sep3", type: "separator" });

        if (notebookShortcuts.size > 0) {
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
      title: strings.assignTo(),
      icon: Plus.path,
      onClick: () => AddTagsDialog.show({ noteIds: ids })
    },
    {
      type: "lazy-loader",
      key: "tags-lazy-loader",
      async items() {
        const tags: Map<string, TagType> = new Map();
        const tagShortcuts: Map<string, TagType> = new Map();

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
              title: strings.removeFromAll(),
              icon: RemoveShortcutLink.path,
              onClick: async () => {
                for (const id of ids) {
                  await db.relations.to({ id, type: "note" }, "tag").unlink();
                }
                tagStore.get().refresh();
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
    if (!note) throw new Error(strings.noteDoesNotExist());

    const result = await exportContent(note, {
      format,
      disableTemplate: true,
      unlockVault: Vault.unlockVault
    });
    if (!result) throw new Error(strings.couldNotConvertNote(format));

    await navigator.clipboard.writeText(result);
    showToast("success", strings.noteCopied());
  } catch (e) {
    if (e instanceof Error)
      showToast("error", `${strings.failedToCopyNote()}: ${e.message}.`);
  }
}

function getMetadataItems(props: {
  note: NoteType;
  context?: Context;
  locked?: boolean;
  attachments?: NoteResolvedData["attachments"];
  notebooks?: NoteResolvedData["notebooks"];
  tags?: NoteResolvedData["tags"];
  reminder?: NoteResolvedData["reminder"];
  primary: SchemeColors;
  isSelected: boolean;
}): React.ReactNode[] {
  const {
    note,
    context,
    locked,
    attachments,
    notebooks,
    tags,
    reminder,
    primary,
    isSelected
  } = props;
  return [
    note.conflicted && <Alert key="conflicted" size={15} color="icon-error" />,
    note.localOnly && <SyncOff key="local-only" size={15} />,
    note.pinned && <NotePin key="pinned" size={15} color="icon" />,
    locked && (
      <NoteLock key="locked" size={15} color="icon" data-test-id="locked" />
    ),
    note.readonly && <NoteReadonly key="readonly" size={15} color="icon" />,
    note.favorite && (
      <NoteFavorite
        key="favorite"
        data-test-id="favorite"
        size={15}
        color="#E5C131"
      />
    ),
    attachments?.total ? (
      <Flex
        key="attachments-total"
        sx={{ alignItems: "center", gap: "spacing1" }}
      >
        <NoteLink size={14} color="icon" />
        <Text sx={{ color: "heading", fontSize: "xs" }}>
          {attachments.total}
        </Text>
      </Flex>
    ) : null,
    attachments?.failed ? (
      <Flex
        key="attachments-failed"
        title={strings.errorsInAttachments(attachments.failed)}
        sx={{ alignItems: "center", gap: "spacing1" }}
      >
        <AttachmentError size={13} color="icon-error" />
        <Text sx={{ color: "paragraph", fontSize: "xs" }}>
          {attachments.failed}
        </Text>
      </Flex>
    ) : null,
    ...(context?.type !== "notebook"
      ? notebooks?.items.map((notebook) => (
          <IconTag
            className="note-chip"
            selected={isSelected}
            key={notebook.id}
            icon={Notebook}
            iconSize={12}
            text={notebook.title}
            onClick={() => {
              appStore.get().setNavigationTab("notebooks");
              navigate(`/notebooks/${notebook.id}`);
            }}
          />
        )) ?? []
      : []),
    ...(tags?.items.map((tag) => (
      <IconTag
        className="note-chip"
        key={tag.id}
        selected={isSelected}
        testId="tag-item"
        icon={TagIcon}
        text={tag.title}
        title={strings.goToTag(tag.title)}
        onClick={(e) => {
          e.stopPropagation();
          if (!tag.id) return showToast("error", strings.tagNotFound());

          appStore.get().setNavigationTab("tags");
          navigate(`/tags/${tag.id}`);
        }}
      />
    )) ?? []),
    reminder && isReminderActive(reminder) && (
      <IconTag
        key="reminder"
        className="note-chip"
        icon={NoteBell}
        selected={isSelected}
        iconSize={13}
        text={getFormattedReminderTime(reminder, true)}
        title={reminder.title}
        styles={
          isReminderToday(reminder)
            ? { icon: { color: primary }, text: { color: primary } }
            : undefined
        }
      />
    )
  ].filter(Boolean);
}
