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

import Clipboard from "@react-native-clipboard/clipboard";
import React, { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Share from "react-native-share";
import { db } from "../common/database";
import { AttachmentDialog } from "../components/attachments";
import { presentDialog } from "../components/dialog/functions";
import NoteHistory from "../components/note-history";
import { AddNotebookSheet } from "../components/sheets/add-notebook";
import MoveNoteSheet from "../components/sheets/add-to";
import ExportNotesSheet from "../components/sheets/export-notes";
import { MoveNotes } from "../components/sheets/move-notes/movenote";
import PublishNoteSheet from "../components/sheets/publish-note";
import { RelationsList } from "../components/sheets/relations-list/index";
import ReminderSheet from "../components/sheets/reminder";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  presentSheet,
  ToastEvent
} from "../services/event-manager";
import Navigation from "../services/navigation";
import Notifications from "../services/notifications";
import { useEditorStore } from "../stores/use-editor-store";
import { useMenuStore } from "../stores/use-menu-store";
import useNavigationStore from "../stores/use-navigation-store";
import { useRelationStore } from "../stores/use-relation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { useTagStore } from "../stores/use-tag-store";
import { useThemeStore } from "../stores/use-theme-store";
import { useUserStore } from "../stores/use-user-store";
import { toTXT } from "../utils";
import { toggleDarkMode } from "../utils/color-scheme/utils";
import {
  eOnTopicSheetUpdate,
  eOpenAddTopicDialog,
  eOpenLoginDialog
} from "../utils/events";
import { deleteItems } from "../utils/functions";
import { sleep } from "../utils/time";

export const useActions = ({ close = () => null, item }) => {
  const colors = useThemeStore((state) => state.colors);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const setSelectedItem = useSelectionStore((state) => state.setSelectedItem);
  const setMenuPins = useMenuStore((state) => state.setMenuPins);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.shortcuts.exists(item.id)
  );
  const user = useUserStore((state) => state.user);
  const [notifPinned, setNotifPinned] = useState(null);
  const alias = item.alias || item.title;

  const isPublished =
    item.type === "note" && db.monographs.isPublished(item.id);

  useEffect(() => {
    if (item.id === null) return;
    checkNotifPinned();
    if (item.type !== "note") {
      setIsPinnedToMenu(db.shortcuts.exists(item.id));
    }
  }, [checkNotifPinned, item]);

  const checkNotifPinned = useCallback(() => {
    let pinned = Notifications.getPinnedNotes();
    if (!pinned) {
      setNotifPinned(null);
      return;
    }

    let index = pinned.findIndex((notif) => notif.id === item.id);
    if (index !== -1) {
      setNotifPinned(pinned[index]);
    } else {
      setNotifPinned(null);
    }
  }, [item.id]);

  const isNoteInTopic = () => {
    const currentScreen = useNavigationStore.getState().currentScreen;
    if (item.type !== "note" || currentScreen.name !== "TopicNotes") return;
    return (
      db.notes?.topicReferences?.get(currentScreen.id)?.indexOf(item.id) > -1
    );
  };

  const isNoteInNotebook = () => {
    const currentScreen = useNavigationStore.getState().currentScreen;
    if (item.type !== "note" || currentScreen.name !== "Notebook") return;

    return !!db.relations
      .to(item, "notebook")
      .find((notebook) => notebook.id === currentScreen.id);
  };

  const onUpdate = useCallback(
    async (type) => {
      if (type === "unpin") {
        await sleep(1000);
        await Notifications.get();
        checkNotifPinned();
      }
    },
    [checkNotifPinned]
  );

  useEffect(() => {
    eSubscribeEvent("onUpdate", onUpdate);

    return () => {
      eUnSubscribeEvent("onUpdate", onUpdate);
    };
  }, [item, onUpdate]);

  function switchTheme() {
    toggleDarkMode();
  }

  function addTo() {
    clearSelection(true);
    setSelectedItem(item);
    MoveNoteSheet.present(item);
  }

  async function addToFavorites() {
    if (!item.id) return;
    close();
    await db.notes.note(item.id).favorite();
    Navigation.queueRoutesForUpdate();
  }

  async function pinItem() {
    if (!item.id) return;
    close();
    let type = item.type;
    await db[`${type}s`][type](item.id).pin();
    Navigation.queueRoutesForUpdate();
  }

  async function pinToNotifications() {
    if (!checkNoteSynced()) return;
    if (Platform.OS === "ios") return;

    if (notifPinned !== null) {
      Notifications.remove(item.id, notifPinned.identifier);
      await sleep(1000);
      await Notifications.get();
      checkNotifPinned();
      return;
    }
    if (item.locked) {
      ToastEvent.show({
        heading: "Note is locked",
        type: "error",
        message: "Locked notes cannot be pinned to notifications",
        context: "local"
      });
      return;
    }
    let text = await toTXT(item, false);
    let html = text.replace(/\n/g, "<br />");
    Notifications.displayNotification({
      title: item.title,
      message: item.headline || text,
      subtitle: item.headline || text,
      bigText: html,
      ongoing: true,
      actions: ["UNPIN"],
      id: item.id
    });
    await sleep(1000);
    await Notifications.get();
    checkNotifPinned();
  }

  async function restoreTrashItem() {
    if (!checkNoteSynced()) return;
    close();
    await db.trash.restore(item.id);
    Navigation.queueRoutesForUpdate();
    let type = item.type === "trash" ? item.itemType : item.type;
    ToastEvent.show({
      heading:
        type === "note"
          ? "Note restored from trash"
          : "Notebook restored from trash",
      type: "success"
    });
  }

  async function copyContent() {
    if (!checkNoteSynced()) return;
    if (item.locked) {
      close();
      await sleep(300);
      openVault({
        copyNote: true,
        novault: true,
        locked: true,
        item: item,
        title: "Copy note",
        description: "Unlock note to copy to clipboard."
      });
    } else {
      Clipboard.setString(await toTXT(item));
      ToastEvent.show({
        heading: "Note copied to clipboard",
        type: "success",
        context: "local"
      });
    }
  }

  async function publishNote() {
    if (!checkNoteSynced()) return;
    if (!user) {
      ToastEvent.show({
        heading: "Login required",
        message: "Login to publish note",
        context: "local",
        func: () => {
          eSendEvent(eOpenLoginDialog);
        },
        actionText: "Login"
      });
      return;
    }

    if (!user?.isEmailConfirmed) {
      ToastEvent.show({
        heading: "Email is not verified",
        message: "Please verify your email first.",
        context: "local"
      });
      return;
    }
    if (item.locked) {
      ToastEvent.show({
        heading: "Locked notes cannot be published",
        type: "error",
        context: "local"
      });
      return;
    }
    PublishNoteSheet.present(item);
  }

  const checkNoteSynced = () => {
    if (!user) return true;
    if (item.type !== "note" || item.itemType !== "note") return true;
    let isTrash = item.itemType === "note";
    if (!isTrash && !db.notes.note(item.id).synced()) {
      ToastEvent.show({
        context: "local",
        heading: "Note not synced",
        message: "Please run sync before making changes",
        type: "error"
      });
      return false;
    }

    if (isTrash && !db.trash.synced(item.id)) {
      ToastEvent.show({
        context: "local",
        heading: "Note not synced",
        message: "Please run sync before making changes",
        type: "error"
      });
      return false;
    }

    return true;
  };

  async function addToVault() {
    if (!item.id) return;
    if (!checkNoteSynced()) return;
    if (item.locked) {
      close();
      await sleep(300);
      openVault({
        item: item,
        novault: true,
        locked: true,
        permanant: true,
        title: "Unlock note",
        description: "Remove note from the vault."
      });
      return;
    }
    try {
      await db.vault.add(item.id);
      let note = db.notes.note(item.id).data;
      if (note.locked) {
        close();
        Navigation.queueRoutesForUpdate();
      }
    } catch (e) {
      close();
      await sleep(300);
      switch (e.message) {
        case db.vault.ERRORS.noVault:
          openVault({
            item: item,
            novault: false,
            title: "Create vault",
            description: "Set a password to create a vault and lock note."
          });
          break;
        case db.vault.ERRORS.vaultLocked:
          openVault({
            item: item,
            novault: true,
            locked: true,
            title: "Lock note",
            description: "Give access to vault to lock this note."
          });
          break;
      }
    }
  }

  async function createMenuShortcut() {
    close();
    try {
      if (isPinnedToMenu) {
        await db.shortcuts.remove(item.id);
      } else {
        if (item.type === "topic") {
          await db.shortcuts.add({
            item: {
              type: "topic",
              id: item.id,
              notebookId: item.notebookId
            }
          });
        } else {
          await db.shortcuts.add({
            item: {
              type: item.type,
              id: item.id
            }
          });
        }
      }
      setIsPinnedToMenu(db.shortcuts.exists(item.id));
      setMenuPins();
    } catch (e) {
      console.error("error", e);
    }
  }

  async function renameTag() {
    close();
    await sleep(300);
    presentDialog({
      title: "Rename tag",
      paragraph: "Change the title of the tag " + alias,
      positivePress: async (value) => {
        if (!value || value === "" || value.trimStart().length == 0) return;
        await db.tags.rename(item.id, db.tags.sanitize(value));
        setImmediate(() => {
          useTagStore.getState().setTags();
          useMenuStore.getState().setMenuPins();
          Navigation.queueRoutesForUpdate();
        });
      },
      input: true,
      defaultValue: alias,
      inputPlaceholder: "Enter title of tag",
      positiveText: "Save"
    });
  }

  async function shareNote() {
    if (!checkNoteSynced()) return;
    if (item.locked) {
      close();
      await sleep(300);
      openVault({
        item: item,
        novault: true,
        locked: true,
        share: true,
        title: "Share note",
        description: "Unlock note to share it."
      });
    } else {
      Share.open({
        title: "Share note to",
        failOnCancel: false,
        message: await toTXT(item)
      });
    }
  }

  async function deleteItem() {
    if (!checkNoteSynced()) return;
    close();
    if (item.type === "tag" || item.type === "reminder") {
      await sleep(300);
      presentDialog({
        title: `Delete ${item.type}`,
        paragraph:
          item.type === "reminder"
            ? "This reminder will be removed"
            : "This tag will be removed from all notes.",
        positivePress: async () => {
          if (item.type === "reminder") {
            await db.reminders.remove(item.id);
          } else {
            await db.tags.remove(item.id);
          }
          setImmediate(() => {
            useTagStore.getState().setTags();
            Navigation.queueRoutesForUpdate();
            useRelationStore.getState().update();
          });
        },
        positiveText: "Delete",
        positiveType: "errorShade"
      });
      return;
    }

    if (item.locked) {
      await sleep(300);
      openVault({
        deleteNote: true,
        novault: true,
        locked: true,
        item: item,
        title: "Delete note",
        description: "Unlock note to delete it."
      });
    } else {
      try {
        close();
        await sleep(300);
        await deleteItems(item);
      } catch (e) {
        console.error(e);
      }
    }
  }
  async function removeNoteFromTopic() {
    const currentScreen = useNavigationStore.getState().currentScreen;
    if (currentScreen.name !== "TopicNotes") return;
    await db.notes.removeFromNotebook(
      {
        id: currentScreen.notebookId,
        topic: currentScreen.id
      },
      item.id
    );
    Navigation.queueRoutesForUpdate();
    eSendEvent(eOnTopicSheetUpdate);
    close();
  }

  async function removeNoteFromNotebook() {
    const currentScreen = useNavigationStore.getState().currentScreen;
    if (currentScreen.name !== "Notebook") return;
    await db.relations.unlink({ type: "notebook", id: currentScreen.id }, item);
    Navigation.queueRoutesForUpdate();
    close();
  }

  async function deleteTrashItem() {
    if (!checkNoteSynced()) return;
    close();
    await sleep(300);
    presentDialog({
      title: "Permanent delete",
      paragraph: `Are you sure you want to delete this ${item.itemType} permanantly from trash?`,
      positiveText: "Delete",
      negativeText: "Cancel",
      positivePress: async () => {
        await db.trash.delete(item.id);
        setImmediate(() => {
          Navigation.queueRoutesForUpdate();
          useSelectionStore.getState().setSelectionMode(false);
          ToastEvent.show({
            heading: "Permanantly deleted items",
            type: "success",
            context: "local"
          });
        });
      },
      positiveType: "errorShade"
    });
  }

  async function openHistory() {
    presentSheet({
      component: (ref) => <NoteHistory fwdRef={ref} note={item} />
    });
  }

  async function showAttachments() {
    AttachmentDialog.present();
  }

  async function exportNote() {
    if (item.locked) {
      ToastEvent.show({
        heading: "Note is locked",
        type: "error",
        message: "Locked notes cannot be exported",
        context: "local"
      });
      return;
    }
    ExportNotesSheet.present([item]);
  }

  async function toggleLocalOnly() {
    if (!checkNoteSynced() || !user) return;
    db.notes.note(item.id).localOnly();
    Navigation.queueRoutesForUpdate();
    close();
  }

  const toggleReadyOnlyMode = async () => {
    await db.notes.note(item.id).readonly();
    let current = db.notes.note(item.id).data.readonly;
    if (useEditorStore.getState().currentEditingNote === item.id) {
      useEditorStore.getState().setReadonly(current);
      //  tiny.call(EditorWebView, tiny.toogleReadMode(current ? 'readonly' : 'design'));
    }
    Navigation.queueRoutesForUpdate();
    close();
  };

  const duplicateNote = async () => {
    if (!checkNoteSynced()) return;
    await db.notes.note(item.id).duplicate();
    Navigation.queueRoutesForUpdate();
    close();
  };
  const actions = [
    {
      id: "notebooks",
      title: "Link Notebooks",
      icon: "book-outline",
      func: addTo
    },
    {
      id: "add-tag",
      title: "Add tags",
      icon: "pound",
      func: addTo
    },
    {
      id: "add-reminder",
      title: "Remind me",
      icon: "clock-plus-outline",
      func: () => {
        ReminderSheet.present(null, { id: item.id, type: "note" });
      },
      close: true
    },
    {
      id: "lock-unlock",
      title: item.locked ? "Unlock" : "Lock",
      icon: item.locked ? "lock-open-outline" : "key-outline",
      func: addToVault,
      on: item.locked
    },
    {
      id: "publish",
      title: isPublished ? "Published" : "Publish",
      icon: "cloud-upload-outline",
      on: isPublished,
      func: publishNote
    },

    {
      id: "export",
      title: "Export",
      icon: "export",
      func: exportNote
    },
    {
      id: "move-notes",
      title: "Add notes",
      icon: "plus",
      func: async () => {
        MoveNotes.present(db.notebooks.notebook(item.notebookId).data, item);
      }
    },
    {
      id: "pin",
      title: item.pinned ? "Unpin" : "Pin",
      icon: item.pinned ? "pin-off-outline" : "pin-outline",
      func: pinItem,
      close: false,
      check: true,
      on: item.pinned,
      pro: true
    },
    {
      id: "favorite",
      title: !item.favorite ? "Favorite" : "Unfavorite",
      icon: item.favorite ? "star-off" : "star-outline",
      func: addToFavorites,
      close: false,
      check: true,
      on: item.favorite,
      pro: true,
      color: "orange"
    },
    {
      id: "pin-to-notifications",
      title:
        notifPinned !== null
          ? "Unpin from notifications"
          : "Pin to notifications",
      icon: "message-badge-outline",
      on: notifPinned !== null,
      func: pinToNotifications
    },

    {
      id: "edit-notebook",
      title: "Edit notebook",
      icon: "square-edit-outline",
      func: async () => {
        AddNotebookSheet.present(item);
      }
    },
    {
      id: "edit-topic",
      title: "Edit topic",
      icon: "square-edit-outline",
      func: async () => {
        close();
        await sleep(300);
        eSendEvent(eOpenAddTopicDialog, {
          notebookId: item.notebookId,
          toEdit: item
        });
      }
    },
    {
      id: "copy",
      title: "Copy",
      icon: "content-copy",
      func: copyContent
    },
    {
      id: "restore",
      title: "Restore " + item.itemType,
      icon: "delete-restore",
      func: restoreTrashItem
    },

    {
      id: "add-shortcut",
      title: isPinnedToMenu ? "Remove Shortcut" : "Add Shortcut",
      icon: isPinnedToMenu ? "link-variant-remove" : "link-variant",
      func: createMenuShortcut,
      close: false,
      check: true,
      on: isPinnedToMenu,
      pro: true
    },
    {
      id: "rename-tag",
      title: "Rename tag",
      icon: "square-edit-outline",
      func: renameTag
    },
    {
      id: "share",
      title: "Share",
      icon: "share-variant",
      func: shareNote
    },
    {
      id: "read-only",
      title: "Read only",
      icon: "pencil-lock",
      func: toggleReadyOnlyMode,
      on: item.readonly
    },
    {
      id: "local-only",
      title: "Local only",
      icon: "sync-off",
      func: toggleLocalOnly,
      on: item.localOnly
    },
    {
      id: "duplicate",
      title: "Duplicate",
      icon: "content-duplicate",
      func: duplicateNote
    },
    {
      id: "dark-mode",
      title: "Dark mode",
      icon: "theme-light-dark",
      func: switchTheme,
      switch: true,
      on: colors.night ? true : false,
      close: false,
      pro: true
    },
    {
      id: "edit-reminder",
      title: "Edit reminder",
      icon: "pencil",
      func: async () => {
        ReminderSheet.present(item);
      },
      close: false
    },

    {
      id: "reminders",
      title: "Reminders",
      icon: "clock-outline",
      func: async () => {
        RelationsList.present({
          reference: item,
          referenceType: "reminder",
          relationType: "from",
          title: "Reminders",
          onAdd: () => ReminderSheet.present(null, item, true),
          button: {
            title: "Add",
            type: "accent",
            onPress: () => ReminderSheet.present(null, item, true),
            icon: "plus"
          }
        });
      },
      close: false
    },
    {
      id: "attachments",
      title: "Attachments",
      icon: "attachment",
      func: showAttachments
    },
    {
      id: "history",
      title: "History",
      icon: "history",
      func: openHistory
    },

    {
      id: "disable-reminder",
      title: !item.disabled ? "Turn off reminder" : "Turn on reminder",
      icon: !item.disabled ? "bell-off-outline" : "bell",
      func: async () => {
        close();
        await db.reminders.add({
          ...item,
          disabled: !item.disabled
        });
        Notifications.scheduleNotification(item);
        useRelationStore.getState().update();
        Navigation.queueRoutesForUpdate();
      }
    },
    {
      id: "remove-from-topic",
      title: "Remove from topic",
      hidden: !isNoteInTopic(),
      icon: "minus-circle-outline",
      func: removeNoteFromTopic
    },
    {
      id: "remove-from-notebook",
      title: "Remove from notebook",
      hidden: !isNoteInNotebook(),
      icon: "minus-circle-outline",
      func: removeNoteFromNotebook
    },
    {
      id: "trash",
      title:
        item.type !== "notebook" && item.type !== "note"
          ? "Delete " + item.type
          : "Move to trash",
      icon: "delete-outline",
      type: "error",
      func: deleteItem
    },
    {
      id: "delete",
      title: "Delete " + item.itemType,
      icon: "delete",
      func: deleteTrashItem
    }
    // {
    //   id: "ReferencedIn",
    //   title: "References",
    //   icon: "link",
    //   func: async () => {
    //     close();
    //     RelationsList.present({
    //       reference: item,
    //       referenceType: "note",
    //       title: "Referenced in",
    //       relationType: "to",
    //     });
    //   }
    // }
  ];

  return actions;
};
