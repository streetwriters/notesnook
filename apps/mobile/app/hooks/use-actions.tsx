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
import {
  Color,
  ItemReference,
  Note,
  Notebook,
  Reminder,
  Tag,
  TrashItem,
  VAULT_ERRORS,
  createInternalLink
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { DisplayedNotification } from "@notifee/react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, Platform } from "react-native";
import Share from "react-native-share";
import { DatabaseLogger, db } from "../common/database";
import { AttachmentDialog } from "../components/attachments";
import { presentDialog } from "../components/dialog/functions";
import NoteHistory from "../components/note-history";
import { AddNotebookSheet } from "../components/sheets/add-notebook";
import MoveNoteSheet from "../components/sheets/add-to";
import ExportNotesSheet from "../components/sheets/export-notes";
import { MoveNotebookSheet } from "../components/sheets/move-notebook";
import { MoveNotes } from "../components/sheets/move-notes/movenote";
import PublishNoteSheet from "../components/sheets/publish-note";
import { ReferencesList } from "../components/sheets/references";
import { RelationsList } from "../components/sheets/relations-list/index";
import ReminderSheet from "../components/sheets/reminder";
import { useSideBarDraggingStore } from "../components/side-menu/dragging-store";
import { useTabStore } from "../screens/editor/tiptap/use-tab-store";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  openVault,
  presentSheet
} from "../services/event-manager";
import Navigation from "../services/navigation";
import Notifications from "../services/notifications";
import { useMenuStore } from "../stores/use-menu-store";
import useNavigationStore from "../stores/use-navigation-store";
import { useRelationStore } from "../stores/use-relation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { useTagStore } from "../stores/use-tag-store";
import { useUserStore } from "../stores/use-user-store";
import { eOpenLoginDialog, eUpdateNoteInEditor } from "../utils/events";
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
    if ((await db.trash.restore(item.id)) === false) return;
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
      title: strings.renameTag(),
      positivePress: async (value: string) => {
        if (!value || value === "" || value.trimStart().length == 0) return;
        try {
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
        } catch (e) {
          ToastManager.error(e as Error, undefined, "local");
        }
      },
      input: true,
      defaultValue: item.title,
      inputPlaceholder: "Enter title of tag",
      positiveText: strings.save()
    });
  }

  async function renameColor() {
    if (item.type !== "color") return;
    close();
    await sleep(300);
    presentDialog({
      title: strings.renameColor(),
      input: true,
      inputPlaceholder: strings.name(),
      defaultValue: item.title,
      positivePress: async (value) => {
        if (!value || value.trim().length === 0) return;
        await db.colors.add({
          id: item.id,
          title: value
        });

        eSendEvent(Navigation.routeNames.ColoredNotes);
        useMenuStore.getState().setColorNotes();
      },
      positiveText: strings.rename()
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
        title: strings.doActions.delete.unknown(item.type, 1),
        paragraph: strings.actionConfirmations.delete.unknown(item.type, 1),
        positivePress: async () => {
          if (item.type === "reminder") {
            await db.reminders.remove(item.id);
            Notifications.setupReminders(true);
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
        positiveText: strings.delete(),
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
        title: strings.deleteNote(),
        description: strings.unlockToDelete()
      });
    } else {
      try {
        await deleteItems(item.type, [item.id]);
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
      title: strings.doActions.delete.unknown(item.itemType, 1),
      paragraph: strings.actionConfirmations.delete.unknown(item.itemType, 1),
      positiveText: strings.delete(),
      negativeText: strings.cancel(),
      positivePress: async () => {
        await db.trash.delete(item.id);
        setImmediate(() => {
          Navigation.queueRoutesForUpdate();
          useSelectionStore.getState().setSelectionMode(undefined);
          ToastManager.show({
            heading: strings.actions.deleted.unknown(item.itemType, 1),
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
      title: strings.rename(),
      icon: "square-edit-outline",
      func: renameTag
    });
  }

  if (item.type === "color") {
    actions.push({
      id: "rename-color",
      title: strings.rename(),
      icon: "square-edit-outline",
      func: renameColor
    });

    actions.push({
      id: "reorder",
      title: strings.reorder(),
      icon: "sort-ascending",
      func: () => {
        useSideBarDraggingStore.setState({
          dragging: true
        });
        close();
      }
    });
  }

  if (item.type === "reminder") {
    actions.push(
      {
        id: "disable-reminder",
        title: !item.disabled
          ? strings.turnOffReminder()
          : strings.turnOnReminder(),
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
        title: strings.editReminder(),
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
        title: strings.restore(),
        icon: "delete-restore",
        func: restoreTrashItem
      },
      {
        id: "delete",
        title: strings.delete(),
        icon: "delete",
        func: deleteTrashItem
      }
    );
  }

  if (item.type === "tag" || item.type === "notebook") {
    actions.push({
      id: "add-shortcut",
      title: isPinnedToMenu ? strings.removeShortcut() : strings.addShortcut(),
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
        title: strings.addNotebook(),
        icon: "plus",
        func: async () => {
          AddNotebookSheet.present(undefined, item);
        }
      },
      {
        id: "edit-notebook",
        title: strings.editNotebook(),
        icon: "square-edit-outline",
        func: async () => {
          AddNotebookSheet.present(item);
        }
      },
      {
        id: "default-notebook",
        title:
          defaultNotebook === item.id
            ? strings.removeAsDefault()
            : strings.setAsDefault(),
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
        title: strings.moveNotes(),
        hidden: item.type !== "notebook",
        icon: "text",
        func: () => {
          MoveNotes.present(item);
        }
      },
      {
        id: "move-notebook",
        title: strings.moveNotebookFix(),
        icon: "arrow-right-bold-box-outline",
        func: () => {
          MoveNotebookSheet.present([item]);
        }
      }
    );
  }

  if (item.type === "notebook" || item.type === "note") {
    actions.push({
      id: "pin",
      title: item.pinned ? strings.unpin() : strings.pin(),
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

      if (useTabStore.getState().hasTabForNote(item.id)) {
        const tabId = useTabStore.getState().getTabForNote(item.id);
        if (!tabId) return;
        useTabStore.getState().updateTab(tabId, {
          readonly: !currentReadOnly
        });
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
          heading: strings.lockedNotesPinnedFailed(),
          type: "error",
          context: "local"
        });
        return;
      }
      const text = await convertNoteToText(item as Note, true);
      const html = (text || "").replace(/\n/g, "<br />");
      await Notifications.displayNotification({
        title: item.title,
        message: (item as Note).headline || text || "",
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
          heading: strings.loginRequired(),
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
          heading: strings.confirmEmailToPublish(),
          context: "local"
        });
        return;
      }
      if (locked) {
        ToastManager.show({
          heading: strings.lockedNotesPublishFailed(),
          type: "error",
          context: "local"
        });
        return;
      }
      PublishNoteSheet.present(item as Note);
    }

    async function shareNote() {
      try {
        if (item.type !== "note") return;
        if (processingId.current === "shareNote") {
          ToastManager.show({
            heading: strings.pleaseWait() + "...",
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
            title: strings.shareNote()
          });
        } else {
          processingId.current = "shareNote";
          const convertedText = await convertNoteToText(item);
          processingId.current = undefined;
          Share.open({
            title: strings.shareNote(),
            failOnCancel: false,
            message: convertedText || ""
          });
        }
      } catch (e) {
        ToastManager.error(e as Error);
        DatabaseLogger.error(e);
        processingId.current = undefined;
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
          title: strings.unlockNote()
        });
        return;
      }
      try {
        await db.vault.add(item.id);
        const locked = await db.vaults.itemExists(item);
        if (locked) {
          close();
          Navigation.queueRoutesForUpdate();
          eSendEvent(eUpdateNoteInEditor, item, true);
        }
      } catch (e: any) {
        close();
        await sleep(300);
        switch (e.message) {
          case VAULT_ERRORS.noVault:
            openVault({
              item: item,
              novault: false,
              title: strings.createVault()
            });
            break;
          case VAULT_ERRORS.vaultLocked:
            openVault({
              item: item,
              novault: true,
              locked: true,
              title: strings.lockNote()
            });
            break;
        }
      }
    }

    async function copyContent() {
      try {
        if (processingId.current === "copyContent") {
          ToastManager.show({
            heading: strings.pleaseWait() + "...",
            context: "local"
          });
          return;
        }

        if (locked) {
          close();
          await sleep(300);
          openVault({
            copyNote: true,
            novault: true,
            locked: true,
            item: item,
            title: strings.copyNote()
          });
        } else {
          processingId.current = "copyContent";
          const text = await convertNoteToText(item as Note, true);
          Clipboard.setString(text || "");
          processingId.current = undefined;
          ToastManager.show({
            heading: strings.noteCopied(),
            type: "success",
            context: "local"
          });
        }
      } catch (e) {
        processingId.current = undefined;
        DatabaseLogger.error(e);
        ToastManager.error(e as Error);
      }
    }

    actions.push(
      {
        id: "favorite",
        title: !item.favorite ? strings.favorite() : strings.unfavorite(),
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
        title: strings.removeFromNotebook(),
        hidden: noteInCurrentNotebook,
        icon: "minus-circle-outline",
        func: removeNoteFromNotebook
      },
      {
        id: "attachments",
        title: strings.attachments(),
        icon: "attachment",
        func: showAttachments
      },
      {
        id: "history",
        title: strings.history(),
        icon: "history",
        func: openHistory
      },
      {
        id: "copy-link",
        title: strings.copyLink(),
        icon: "link",
        func: () => {
          Clipboard.setString(createInternalLink("note", item.id));
          ToastManager.show({
            heading: strings.linkCopied(),
            message: createInternalLink("note", item.id),
            context: "local",
            type: "success"
          });
        }
      },
      {
        id: "reminders",
        title: strings.dataTypesPluralCamelCase.reminder(),
        icon: "clock-outline",
        func: async () => {
          RelationsList.present({
            reference: item,
            referenceType: "reminder",
            relationType: "from",
            title: strings.dataTypesPluralCamelCase.reminder(),
            onAdd: () => ReminderSheet.present(undefined, item, true),
            button: {
              title: strings.add(),
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
        title: strings.copy(),
        icon: "content-copy",
        func: copyContent
      },
      {
        id: "share",
        title: strings.share(),
        icon: "share-variant",
        func: shareNote
      },
      {
        id: "read-only",
        title: strings.readOnly(),
        icon: "pencil-lock",
        func: toggleReadyOnlyMode,
        on: item.readonly
      },
      {
        id: "local-only",
        title: strings.syncOff(),
        icon: "sync-off",
        func: toggleLocalOnly,
        on: item.localOnly
      },
      {
        id: "duplicate",
        title: strings.duplicate(),
        icon: "content-duplicate",
        func: duplicateNote
      },

      {
        id: "add-reminder",
        title: strings.remindMe(),
        icon: "clock-plus-outline",
        func: () => {
          ReminderSheet.present(undefined, { id: item.id, type: "note" });
        },
        close: true
      },
      {
        id: "lock-unlock",
        title: locked ? strings.unlock() : strings.lock(),
        icon: locked ? "lock-open-outline" : "key-outline",
        func: addToVault,
        on: locked
      },
      {
        id: "publish",
        title: isPublished ? strings.published() : strings.publish(),
        icon: "cloud-upload-outline",
        on: isPublished,
        func: publishNote
      },

      {
        id: "export",
        title: strings.export(),
        icon: "export",
        func: exportNote
      },

      {
        id: "pin-to-notifications",
        title: notifPinned
          ? strings.unpinFromNotifications()
          : strings.pinToNotifications(),
        icon: "message-badge-outline",
        on: !!notifPinned,
        func: pinToNotifications
      },

      {
        id: "notebooks",
        title: strings.linkNotebooks(),
        icon: "book-outline",
        func: addTo
      },
      {
        id: "add-tag",
        title: strings.addTags(),
        icon: "pound",
        func: addTo
      },
      {
        id: "references",
        title: strings.references(),
        icon: "vector-link",
        func: () => {
          ReferencesList.present({
            reference: item as ItemReference
          });
        }
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
        ? strings.doActions.delete.unknown(
            item.type === "trash" ? item.itemType : item.type,
            1
          )
        : strings.moveToTrash(),
    icon: "delete-outline",
    type: "error",
    func: deleteItem
  });

  return actions;
};
