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
/* eslint-disable no-inner-declarations */
import { VAULT_ERRORS } from "@notesnook/core/dist/api/vault";
import {
  Color,
  Note,
  Notebook,
  Reminder,
  Tag,
  TrashItem
} from "@notesnook/core/dist/types";
import { DisplayedNotification } from "@notifee/react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, Platform } from "react-native";
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
import { useSideBarDraggingStore } from "../components/side-menu/dragging-store";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  openVault,
  presentSheet
} from "../services/event-manager";
import Navigation from "../services/navigation";
import Notifications from "../services/notifications";
import { useEditorStore } from "../stores/use-editor-store";
import { useMenuStore } from "../stores/use-menu-store";
import useNavigationStore from "../stores/use-navigation-store";
import { useRelationStore } from "../stores/use-relation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { useTagStore } from "../stores/use-tag-store";
import { useUserStore } from "../stores/use-user-store";
import Errors from "../utils/errors";
import { eOpenLoginDialog } from "../utils/events";
import { deleteItems } from "../utils/functions";
import { convertNoteToText } from "../utils/note-to-text";
import { sleep } from "../utils/time";

export const useActions = ({
  close,
  item
}: {
  item: Note | Notebook | Reminder | Tag | Color | TrashItem;
  close: () => void;
}) => {
  const setMenuPins = useMenuStore((state) => state.setMenuPins);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.shortcuts.exists(item.id)
  );
  const processingId = useRef<"shareNote" | "copyContent">();
  const user = useUserStore((state) => state.user);
  const [notifPinned, setNotifPinned] = useState<DisplayedNotification>();

  const [defaultNotebook, setDefaultNotebook] = useState(
    db.settings.getDefaultNotebook()
  );
  const [noteInCurrentNotebook, setNoteInCurrentNotebook] = useState(false);

  const isPublished =
    item.type === "note" && db.monographs.isPublished(item.id);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (item.type === "note") {
      db.vaults.itemExists(item).then((locked) => setLocked(locked));
    }
  }, [item]);

  const checkNotifPinned = useCallback(() => {
    const pinned = Notifications.getPinnedNotes();

    if (!pinned || pinned.length === 0) {
      setNotifPinned(undefined);
      return;
    }
    const index = pinned.findIndex((notif) => notif.id === item.id);
    if (index !== -1) {
      setNotifPinned(pinned[index]);
    } else {
      setNotifPinned(undefined);
    }
  }, [item.id]);

  useEffect(() => {
    if (item.type !== "note") return;
    checkNotifPinned();
    setIsPinnedToMenu(db.shortcuts.exists(item.id));
  }, [checkNotifPinned, item]);

  const onUpdate = useCallback(
    async (type: string) => {
      if (type === "unpin") {
        await Notifications.get();
        checkNotifPinned();
      }
    },
    [checkNotifPinned]
  );

  useEffect(() => {
    const sub = eSubscribeEvent(Notifications.Events.onUpdate, onUpdate);
    return () => {
      sub?.unsubscribe();
    };
  }, [item, onUpdate]);

  async function restoreTrashItem() {
    if (!checkItemSynced()) return;
    close();
    await db.trash.restore(item.id);
    Navigation.queueRoutesForUpdate();
    const type = item.type === "trash" ? item.itemType : item.type;
    ToastManager.show({
      heading:
        type === "note"
          ? "Note restored from trash"
          : "Notebook restored from trash",
      type: "success"
    });
  }

  async function pinItem() {
    if (!item.id) return;
    close();
    if (item.type === "note") {
      await db.notes.pin(!item?.pinned, item.id);
    } else if (item.type === "notebook") {
      await db.notebooks.pin(!item?.pinned, item.id);
    }

    Navigation.queueRoutesForUpdate();
  }

  const checkItemSynced = () => {
    return true;
  };

  async function createMenuShortcut() {
    if (item.type !== "notebook" && item.type !== "tag") return;

    close();
    try {
      if (isPinnedToMenu) {
        await db.shortcuts.remove(item.id);
      } else {
        await db.shortcuts.add({
          itemId: item.id,
          itemType: item.type
        });
      }
      setIsPinnedToMenu(db.shortcuts.exists(item.id));
      setMenuPins();
    } catch (e) {
      console.error("error", e);
    }
  }

  async function renameTag() {
    if (item.type !== "tag") return;

    close();
    await sleep(300);
    presentDialog({
      title: "Rename tag",
      paragraph: "Change the title of the tag " + item.title,
      positivePress: async (value: string) => {
        if (!value || value === "" || value.trimStart().length == 0) return;

        await db.tags.add({
          id: item.id,
          title: value
        });

        eSendEvent(Navigation.routeNames.TaggedNotes);
        InteractionManager.runAfterInteractions(() => {
          useTagStore.getState().refresh();
          useMenuStore.getState().setMenuPins();
          Navigation.queueRoutesForUpdate();
          useRelationStore.getState().update();
        });
      },
      input: true,
      defaultValue: item.title,
      inputPlaceholder: "Enter title of tag",
      positiveText: "Save"
    });
  }

  async function renameColor() {
    if (item.type !== "color") return;
    close();
    await sleep(300);
    presentDialog({
      title: "Rename color",
      input: true,
      inputPlaceholder: "Enter name for this color",
      defaultValue: item.title,
      paragraph: "You are renaming the color " + item.title,
      positivePress: async (value) => {
        if (!value || value.trim().length === 0) return;
        await db.colors.add({
          id: item.id,
          title: value
        });

        eSendEvent(Navigation.routeNames.ColoredNotes);
        useMenuStore.getState().setColorNotes();
      },
      positiveText: "Rename"
    });
  }

  const deleteItem = async () => {
    close();
    await sleep(300);

    if (
      item.type === "tag" ||
      item.type === "reminder" ||
      item.type === "color"
    ) {
      presentDialog({
        title: `Delete ${item.type}`,
        paragraph: `Are you sure you want to delete this ${item.type}?`,
        positivePress: async () => {
          if (item.type === "reminder") {
            await db.reminders.remove(item.id);
          } else if (item.type === "color") {
            await db.colors.remove(item.id);
            useMenuStore.getState().setColorNotes();
          } else {
            await db.tags.remove(item.id);
          }

          setImmediate(() => {
            useTagStore.getState().refresh();
            Navigation.queueRoutesForUpdate();
            useRelationStore.getState().update();
          });
        },
        positiveText: "Delete",
        positiveType: "errorShade"
      });
      return;
    }

    if (item.type === "note" && (await db.vaults.itemExists(item))) {
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
        await deleteItems([item.id], item.type);
      } catch (e) {
        console.error(e);
      }
    }
  };

  async function deleteTrashItem() {
    if (item.type !== "trash") return;
    if (!checkItemSynced()) return;
    close();
    await sleep(300);
    presentDialog({
      title: "Permanent delete",
      paragraph: `Are you sure you want to delete this ${item.itemType} permanently from trash?`,
      positiveText: "Delete",
      negativeText: "Cancel",
      positivePress: async () => {
        await db.trash.delete(item.id);
        setImmediate(() => {
          Navigation.queueRoutesForUpdate();
          useSelectionStore.getState().setSelectionMode(undefined);
          ToastManager.show({
            heading: "Permanently deleted items",
            type: "success",
            context: "local"
          });
        });
      },
      positiveType: "errorShade"
    });
  }

  const actions: {
    id: string;
    title: string;
    icon: string;
    func: () => void;
    close?: boolean;
    check?: boolean;
    on?: boolean;
    pro?: boolean;
    switch?: boolean;
    hidden?: boolean;
    type?: string;
    color?: string;
  }[] = [
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

  if (item.type === "tag") {
    actions.push({
      id: "rename-tag",
      title: "Rename",
      icon: "square-edit-outline",
      func: renameTag
    });
  }

  if (item.type === "color") {
    actions.push({
      id: "rename-color",
      title: "Rename",
      icon: "square-edit-outline",
      func: renameColor
    });

    actions.push({
      id: "reorder",
      title: "Reorder",
      icon: "sort-ascending",
      func: () => {
        useSideBarDraggingStore.setState({
          dragging: true
        });
      }
    });
  }

  if (item.type === "reminder") {
    actions.push(
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
        id: "edit-reminder",
        title: "Edit reminder",
        icon: "pencil",
        func: async () => {
          ReminderSheet.present(item);
        },
        close: false
      }
    );
  }

  if (item.type === "trash") {
    actions.push(
      {
        id: "restore",
        title: "Restore " + item.itemType,
        icon: "delete-restore",
        func: restoreTrashItem
      },
      {
        id: "delete",
        title: "Delete " + item.itemType,
        icon: "delete",
        func: deleteTrashItem
      }
    );
  }

  if (item.type === "tag" || item.type === "notebook") {
    actions.push({
      id: "add-shortcut",
      title: isPinnedToMenu ? "Remove Shortcut" : "Add Shortcut",
      icon: isPinnedToMenu ? "link-variant-remove" : "link-variant",
      func: createMenuShortcut,
      close: false,
      check: true,
      on: isPinnedToMenu,
      pro: true
    });
  }

  if (item.type === "notebook") {
    actions.push(
      {
        id: "add-notebook",
        title: "Add notebook",
        icon: "plus",
        func: async () => {
          AddNotebookSheet.present(undefined, item);
        }
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
        id: "default-notebook",
        title:
          defaultNotebook === item.id ? "Remove as default" : "Set as default",
        hidden: item.type !== "notebook",
        icon: "notebook",
        func: async () => {
          if (defaultNotebook === item.id) {
            await db.settings.setDefaultNotebook(undefined);
            setDefaultNotebook(undefined);
          } else {
            const notebook = {
              id: item.id
            };
            await db.settings.setDefaultNotebook(notebook.id);
            setDefaultNotebook(notebook.id);
          }
          close();
        },
        on: defaultNotebook === item.id
      },
      {
        id: "move-notes",
        title: "Move notes",
        hidden: item.type !== "notebook",
        icon: "text",
        func: () => {
          MoveNotes.present(item);
        }
      }
    );
  }

  if (item.type === "notebook" || item.type === "note") {
    actions.push({
      id: "pin",
      title: item.pinned ? "Unpin" : "Pin",
      icon: item.pinned ? "pin-off-outline" : "pin-outline",
      func: pinItem,
      close: false,
      check: true,
      on: item.pinned,
      pro: true
    });
  }

  if (item.type === "note") {
    async function openHistory() {
      presentSheet({
        component: (ref) => <NoteHistory fwdRef={ref} note={item as Note} />
      });
    }

    async function showAttachments() {
      AttachmentDialog.present(item as Note);
    }

    async function exportNote() {
      if (item.type !== "note") return;
      ExportNotesSheet.present([item.id]);
    }

    async function toggleLocalOnly() {
      if (!checkItemSynced() || !user) return;
      await db.notes.localOnly(!(item as Note).localOnly, item?.id);
      Navigation.queueRoutesForUpdate();
      close();
    }

    const toggleReadyOnlyMode = async () => {
      const currentReadOnly = (item as Note).readonly;
      await db.notes.readonly(!currentReadOnly, item?.id);

      if (useEditorStore.getState().currentEditingNote === item.id) {
        useEditorStore.getState().setReadonly(!currentReadOnly);
      }
      Navigation.queueRoutesForUpdate();
      close();
    };

    const duplicateNote = async () => {
      if (!checkItemSynced()) return;
      await db.notes.duplicate(item.id);
      Navigation.queueRoutesForUpdate();
      close();
    };

    async function removeNoteFromNotebook() {
      const { currentRoute, focusedRouteId } = useNavigationStore.getState();
      if (currentRoute !== "Notebook" || !focusedRouteId) return;

      await db.relations.unlink({ type: "notebook", id: focusedRouteId }, item);
      Navigation.queueRoutesForUpdate();
      close();
    }

    function addTo() {
      MoveNoteSheet.present(item as Note);
    }

    async function addToFavorites() {
      if (!item.id || item.type !== "note") return;
      close();
      await db.notes.favorite(!item.favorite, item.id);
      Navigation.queueRoutesForUpdate();
    }

    async function pinToNotifications() {
      if (!checkItemSynced()) return;
      if (Platform.OS === "ios") return;

      if (notifPinned) {
        Notifications.remove(item.id);
        await Notifications.get();
        checkNotifPinned();
        return;
      }
      if (locked) {
        ToastManager.show({
          heading: "Note is locked",
          type: "error",
          message: "Locked notes cannot be pinned to notifications",
          context: "local"
        });
        return;
      }
      const text = await convertNoteToText(item as Note, false);
      if (!text) {
        ToastManager.error(
          new Error(Errors.export("text")),
          undefined,
          "local"
        );
        return;
      }

      const html = text.replace(/\n/g, "<br />");
      await Notifications.displayNotification({
        title: item.title,
        message: (item as Note).headline || text,
        subtitle: "",
        bigText: html,
        ongoing: true,
        actions: ["UNPIN"],
        id: item.id
      });
      await Notifications.get();
      checkNotifPinned();
    }

    async function publishNote() {
      if (!checkItemSynced()) return;
      if (!user) {
        ToastManager.show({
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
        ToastManager.show({
          heading: "Email is not verified",
          message: "Please verify your email first.",
          context: "local"
        });
        return;
      }
      if (locked) {
        ToastManager.show({
          heading: "Locked notes cannot be published",
          type: "error",
          context: "local"
        });
        return;
      }
      PublishNoteSheet.present(item as Note);
    }

    async function shareNote() {
      if (item.type !== "note") return;

      if (processingId.current === "shareNote") {
        ToastManager.show({
          heading: "Please wait...",
          message: "We are preparing your note for sharing",
          context: "local"
        });
        return;
      }
      if (!checkItemSynced()) return;
      if (locked) {
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
        processingId.current = "shareNote";
        const convertedText = await convertNoteToText(item);
        if (!convertedText) {
          ToastManager.error(new Error(Errors.export("text")));
          return;
        }
        processingId.current = undefined;
        Share.open({
          title: "Share note to",
          failOnCancel: false,
          message: convertedText
        });
      }
    }

    async function addToVault() {
      if (item.type !== "note") return;

      if (!checkItemSynced()) return;
      if (locked) {
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
        const note = await db.notes.note(item.id);
        if (locked) {
          close();
          Navigation.queueRoutesForUpdate();
        }
      } catch (e: any) {
        close();
        await sleep(300);
        switch (e.message) {
          case VAULT_ERRORS.noVault:
            openVault({
              item: item,
              novault: false,
              title: "Create vault",
              description: "Set a password to create a vault and lock note."
            });
            break;
          case VAULT_ERRORS.vaultLocked:
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

    async function copyContent() {
      if (processingId.current === "copyContent") {
        ToastManager.show({
          heading: "Please wait...",
          message: "We are preparing your note for copy to clipboard",
          context: "local"
        });
        return;
      }
      if (!checkItemSynced()) return;
      if (locked) {
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
        processingId.current = "copyContent";

        const text = await convertNoteToText(item as Note, true);
        if (!text) {
          ToastManager.error(new Error(Errors.export("text")));
          return;
        }
        Clipboard.setString(text);
        processingId.current = undefined;
        ToastManager.show({
          heading: "Note copied to clipboard",
          type: "success",
          context: "local"
        });
      }
    }

    actions.push(
      {
        id: "favorite",
        title: item.favorite ? "Unfav" : "Fav",
        icon: item.favorite ? "star-off" : "star-outline",
        func: addToFavorites,
        close: false,
        check: true,
        on: item.favorite,
        pro: true,
        color: "orange"
      },
      {
        id: "remove-from-notebook",
        title: "Remove from notebook",
        hidden: noteInCurrentNotebook,
        icon: "minus-circle-outline",
        func: removeNoteFromNotebook
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
        id: "reminders",
        title: "Reminders",
        icon: "clock-outline",
        func: async () => {
          RelationsList.present({
            reference: item,
            referenceType: "reminder",
            relationType: "from",
            title: "Reminders",
            onAdd: () => ReminderSheet.present(undefined, item, true),
            button: {
              title: "Add",
              type: "accent",
              onPress: () => ReminderSheet.present(undefined, item, true),
              icon: "plus"
            }
          });
        },
        close: false
      },

      {
        id: "copy",
        title: "Copy",
        icon: "content-copy",
        func: copyContent
      },
      {
        id: "share",
        title: "Share",
        icon: "share-variant",
        func: shareNote
      },
      {
        id: "read-only",
        title: "Readonly",
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
        id: "add-reminder",
        title: "Remind me",
        icon: "clock-plus-outline",
        func: () => {
          ReminderSheet.present(undefined, { id: item.id, type: "note" });
        },
        close: true
      },
      {
        id: "lock-unlock",
        title: locked ? "Unlock" : "Lock",
        icon: locked ? "lock-open-outline" : "key-outline",
        func: addToVault,
        on: locked
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
        id: "pin-to-notifications",
        title: notifPinned
          ? "Unpin from notifications"
          : "Pin to notifications",
        icon: "message-badge-outline",
        on: !!notifPinned,
        func: pinToNotifications
      },

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
      }
    );
  }

  useEffect(() => {
    const { currentRoute, focusedRouteId } = useNavigationStore.getState();
    if (item.type !== "note" || currentRoute !== "Notebook" || !focusedRouteId)
      return;

    !!db.relations
      .to(item, "notebook")
      .selector.find((v) => v("id", "==", focusedRouteId))
      .then((notebook) => {
        setNoteInCurrentNotebook(!!notebook);
      });
  }, [item]);

  actions.push({
    id: "trash",
    title:
      item.type !== "notebook" && item.type !== "note"
        ? "Delete " + item.type
        : "Move to trash",
    icon: "delete-outline",
    type: "error",
    func: deleteItem
  });

  return actions;
};
