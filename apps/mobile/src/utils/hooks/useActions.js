import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Share from 'react-native-share';
import { editing, toTXT } from '..';
import { notesnook } from '../../../e2e/test.ids';
import { presentDialog } from '../../components/dialog/functions';
import NoteHistory from '../../components/note-history';
import { MoveNotes } from '../../components/sheets/move-notes/movenote';
import { EditorWebView } from '../../screens/editor/Functions';
import tiny from '../../screens/editor/tiny/tiny.js';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  presentSheet,
  ToastEvent
} from '../../services/event-manager';
import Navigation from '../../services/navigation';
import Notifications from '../../services/notifications';
import {
  useEditorStore,
  useMenuStore,
  useSelectionStore,
  useTagStore,
  useUserStore
} from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { toggleDarkMode } from '../color-scheme/utils';
import { db } from '../database';
import {
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog,
  eOpenAttachmentsDialog,
  eOpenExportDialog,
  eOpenLoginDialog,
  eOpenMoveNoteDialog,
  eOpenPublishNoteDialog
} from '../events';
import { deleteItems } from '../functions';
import { sleep } from '../time';

export const useActions = ({ close = () => {}, item }) => {
  const colors = useThemeStore(state => state.colors);
  const clearSelection = useSelectionStore(state => state.clearSelection);
  const setSelectedItem = useSelectionStore(state => state.setSelectedItem);
  const setMenuPins = useMenuStore(state => state.setMenuPins);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(db.settings.isPinned(item.id));
  console.log(item.readonly, 'readonly');
  const user = useUserStore(state => state.user);
  const [notifPinned, setNotifPinned] = useState(null);
  const alias =
    item.type === 'tag'
      ? db.tags.alias(item.id)
      : item.type === 'color'
      ? db.colors.alias(item.id)
      : item.title;

  const isPublished = item.type === 'note' && db.monographs.isPublished(item.id);
  const noteInTopic =
    item.type === 'note' &&
    editing.actionAfterFirstSave.type === 'topic' &&
    db.notebooks
      .notebook(editing.actionAfterFirstSave.notebook)
      .topics.topic(editing.actionAfterFirstSave.id)
      .has(item.id);

  useEffect(() => {
    if (item.id === null) return;
    checkNotifPinned();
    if (item.type !== 'note') {
      setIsPinnedToMenu(db.settings.isPinned(item.id));
    }
  }, [item]);

  function checkNotifPinned() {
    let pinned = Notifications.getPinnedNotes();
    if (!pinned) {
      setNotifPinned(null);
      return;
    }

    let index = pinned.findIndex(notif => notif.tag === item.id);
    if (index !== -1) {
      setNotifPinned(pinned[index]);
    } else {
      setNotifPinned(null);
    }
  }

  const onUpdate = async type => {
    if (type === 'unpin') {
      await sleep(1000);
      await Notifications.get();
      checkNotifPinned();
    }
  };

  useEffect(() => {
    eSubscribeEvent('onUpdate', onUpdate);

    return () => {
      eUnSubscribeEvent('onUpdate', onUpdate);
    };
  }, [item]);

  function switchTheme() {
    toggleDarkMode();
  }

  function addTo() {
    close();
    clearSelection(true);
    setSelectedItem(item);
    setTimeout(() => {
      eSendEvent(eOpenMoveNoteDialog, item);
    }, 300);
  }

  async function addToFavorites() {
    if (!item.id) return;
    close();
    await db.notes.note(item.id).favorite();
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);
  }

  async function pinItem() {
    if (!item.id) return;
    close();
    let type = item.type;
    if (db[`${type}s`].pinned.length === 3 && !item.pinned) {
      ToastEvent.show({
        heading: `Cannot pin more than 3 ${type}s`,
        type: 'error'
      });
      return;
    }
    await db[`${type}s`][type](item.id).pin();
    Navigation.setRoutesToUpdate([Navigation.routeNames.Notebooks, Navigation.routeNames.Notes]);
  }

  async function pinToNotifications() {
    if (Platform.OS === 'ios') return;
    if (notifPinned !== null) {
      Notifications.remove(item.id, notifPinned.identifier);
      await sleep(1000);
      await Notifications.get();
      checkNotifPinned();
      return;
    }
    if (item.locked) return;
    Notifications.present({
      title: item.title,
      message: item.headline,
      subtitle: item.headline,
      bigText: await toTXT(item, true),
      ongoing: true,
      actions: ['UNPIN'],
      tag: item.id
    });
    await sleep(1000);
    await Notifications.get();
    checkNotifPinned();
  }

  async function restoreTrashItem() {
    close();
    await db.trash.restore(item.id);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Tags,
      Navigation.routeNames.Notes,
      Navigation.routeNames.Notebooks,
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Trash
    ]);
    let type = item.type === 'trash' ? item.itemType : item.type;
    ToastEvent.show({
      heading: type === 'note' ? 'Note restored from trash' : 'Notebook restored from trash',
      type: 'success'
    });
  }

  async function copyContent() {
    if (item.locked) {
      close();
      await sleep(300);
      openVault({
        copyNote: true,
        novault: true,
        locked: true,
        item: item,
        title: 'Copy note',
        description: 'Unlock note to copy to clipboard.'
      });
    } else {
      Clipboard.setString(await toTXT(item));
      ToastEvent.show({
        heading: 'Note copied to clipboard',
        type: 'success',
        context: 'local'
      });
    }
  }

  async function publishNote() {
    if (!user) {
      ToastEvent.show({
        heading: 'Login required',
        message: 'Login to publish note',
        context: 'local',
        func: () => {
          eSendEvent(eOpenLoginDialog);
        },
        actionText: 'Login'
      });
      return;
    }

    if (!user?.isEmailConfirmed) {
      ToastEvent.show({
        heading: 'Email is not verified',
        message: 'Please verify your email first.',
        context: 'local'
      });
      return;
    }
    if (item.locked) {
      ToastEvent.show({
        heading: 'Locked notes cannot be published',
        type: 'error',
        context: 'local'
      });
      return;
    }
    close();
    await sleep(300);
    eSendEvent(eOpenPublishNoteDialog, item);
  }

  async function addToVault() {
    if (!item.id) return;
    if (item.locked) {
      close();
      await sleep(300);
      openVault({
        item: item,
        novault: true,
        locked: true,
        permanant: true,
        title: 'Unlock note',
        description: 'Remove note from the vault.'
      });
      return;
    }
    try {
      await db.vault.add(item.id);
      let note = db.notes.note(item.id).data;
      if (note.locked) {
        close();
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Notes
        ]);
      }
    } catch (e) {
      close();
      await sleep(300);
      switch (e.message) {
        case db.vault.ERRORS.noVault:
          openVault({
            item: item,
            novault: false,
            title: 'Create vault',
            description: 'Set a password to create a vault and lock note.'
          });
          break;
        case db.vault.ERRORS.vaultLocked:
          openVault({
            item: item,
            novault: true,
            locked: true,
            title: 'Lock note',
            description: 'Give access to vault to lock this note.'
          });
          break;
      }
    }
  }

  async function createMenuShortcut() {
    close();
    try {
      if (isPinnedToMenu) {
        await db.settings.unpin(item.id);
      } else {
        if (item.type === 'topic') {
          await db.settings.pin(item.type, {
            id: item.id,
            notebookId: item.notebookId
          });
        } else {
          await db.settings.pin(item.type, { id: item.id });
        }
      }
      setIsPinnedToMenu(db.settings.isPinned(item.id));
      setMenuPins();
    } catch (e) {}
  }

  async function renameTag() {
    close();
    await sleep(300);
    presentDialog({
      title: 'Rename tag',
      paragraph: 'Change the title of the tag ' + alias,
      positivePress: async value => {
        if (!value || value === '' || value.trimStart().length == 0) return;
        await db.tags.rename(item.id, db.tags.sanitize(value));
        useTagStore.getState().setTags();
        useMenuStore.getState().setMenuPins();
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Tags
        ]);
      },
      input: true,
      defaultValue: alias,
      inputPlaceholder: 'Enter title of tag',
      positiveText: 'Save'
    });
  }

  async function shareNote() {
    if (item.locked) {
      close();
      await sleep(300);
      openVault({
        item: item,
        novault: true,
        locked: true,
        share: true,
        title: 'Share note',
        description: 'Unlock note to share it.'
      });
    } else {
      Share.open({
        title: 'Share note to',
        failOnCancel: false,
        message: await toTXT(item)
      });
    }
  }

  async function deleteItem() {
    close();
    if (item.type === 'tag') {
      await sleep(300);
      presentDialog({
        title: 'Delete tag',
        paragraph: 'This tag will be removed from all notes.',
        positivePress: async value => {
          await db.tags.remove(item.id);
          useTagStore.getState().setTags();
          Navigation.setRoutesToUpdate([
            Navigation.routeNames.Notes,
            Navigation.routeNames.NotesPage,
            Navigation.routeNames.Tags
          ]);
        },
        positiveText: 'Delete',
        positiveType: 'errorShade'
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
        title: 'Delete note',
        description: 'Unlock note to delete it.'
      });
    } else {
      try {
        close();
        await deleteItems(item);
      } catch (e) {}
    }
  }
  async function removeNoteFromTopic() {
    await db.notebooks
      .notebook(editing.actionAfterFirstSave.notebook)
      .topics.topic(editing.actionAfterFirstSave.id)
      .delete(item.id);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notebooks,
      Navigation.routeNames.Notes,
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Notebook
    ]);
    close();
  }

  async function deleteTrashItem() {
    close();
    await sleep(300);
    presentDialog({
      title: `Permanent delete`,
      paragraph: `Are you sure you want to delete this ${item.itemType} permanantly from trash?`,
      positiveText: 'Delete',
      negativeText: 'Cancel',
      positivePress: async () => {
        await db.trash.delete(item.id);
        Navigation.setRoutesToUpdate([Navigation.routeNames.Trash]);
        useSelectionStore.getState().setSelectionMode(false);
        ToastEvent.show({
          heading: 'Permanantly deleted items',
          type: 'success',
          context: 'local'
        });
      },
      positiveType: 'errorShade'
    });
  }

  async function openHistory() {
    close();
    await sleep(300);
    presentSheet({
      component: ref => <NoteHistory ref={ref} note={item} />
    });
  }

  async function showAttachments() {
    close();
    await sleep(300);
    eSendEvent(eOpenAttachmentsDialog, item);
  }

  async function exportNote() {
    close();
    await sleep(300);
    eSendEvent(eOpenExportDialog, [item]);
  }

  const toggleReadyOnlyMode = async () => {
    await db.notes.note(item.id).readonly();
    let current = db.notes.note(item.id).data.readonly;
    if (useEditorStore.getState().currentEditingNote === item.id) {
      useEditorStore.getState().setReadonly(current);
      tiny.call(EditorWebView, tiny.toogleReadMode(current ? 'readonly' : 'design'));
    }
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);
    close();
  };

  const actions = [
    {
      name: 'Add to notebook',
      title: 'Add to notebook',
      icon: 'book-outline',
      func: addTo
    },
    {
      name: 'Move notes',
      title: 'Add notes',
      icon: 'plus',
      func: async () => {
        close();
        await sleep(300);
        MoveNotes.present(db.notebooks.notebook(item.notebookId).data, item);
      }
    },

    {
      name: 'Pin',
      title: item.pinned ? 'Unpin' : 'Pin to top',
      icon: item.pinned ? 'pin-off-outline' : 'pin-outline',
      func: pinItem,
      close: false,
      check: true,
      on: item.pinned,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.pin
    },
    {
      name: 'Favorite',
      title: !item.favorite ? 'Favorite' : 'Unfavorite',
      icon: item.favorite ? 'star-off' : 'star-outline',
      func: addToFavorites,
      close: false,
      check: true,
      on: item.favorite,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.favorite,
      color: 'orange'
    },
    {
      name: 'PinToNotif',
      title: notifPinned !== null ? 'Unpin from Notifications' : 'Pin to Notifications',
      icon: 'bell',
      on: notifPinned !== null,
      func: pinToNotifications
    },

    {
      name: 'Edit Notebook',
      title: 'Edit notebook',
      icon: 'square-edit-outline',
      func: async () => {
        close();
        await sleep(300);
        eSendEvent(eOpenAddNotebookDialog, item);
      }
    },
    {
      name: 'Edit Topic',
      title: 'Edit topic',
      icon: 'square-edit-outline',
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
      name: 'Copy',
      title: 'Copy',
      icon: 'content-copy',
      func: copyContent
    },
    {
      name: 'Restore',
      title: 'Restore ' + item.itemType,
      icon: 'delete-restore',
      func: restoreTrashItem
    },

    {
      name: 'Publish',
      title: isPublished ? 'Published' : 'Publish',
      icon: 'cloud-upload-outline',
      on: isPublished,
      func: publishNote
    },
    {
      name: 'Vault',
      title: item.locked ? 'Remove from vault' : 'Add to vault',
      icon: item.locked ? 'shield-off-outline' : 'shield-outline',
      func: addToVault,
      on: item.locked
    },

    {
      name: 'Add Shortcut',
      title: isPinnedToMenu ? 'Remove Shortcut' : 'Add Shortcut',
      icon: isPinnedToMenu ? 'link-variant-remove' : 'link-variant',
      func: createMenuShortcut,
      close: false,
      check: true,
      on: isPinnedToMenu,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.pinMenu
    },
    {
      name: 'Rename Tag',
      title: 'Rename tag',
      icon: 'square-edit-outline',
      func: renameTag
    },
    {
      name: 'Share',
      title: 'Share',
      icon: 'share-variant',
      func: shareNote
    },
    {
      name: 'Attachments',
      title: 'Attachments',
      icon: 'attachment',
      func: showAttachments
    },
    {
      name: 'Export',
      title: 'Export',
      icon: 'export',
      func: exportNote
    },
    {
      name: 'RemoveTopic',
      title: 'Remove from topic',
      hidden: !noteInTopic,
      icon: 'minus-circle-outline',
      func: removeNoteFromTopic
    },
    {
      name: 'Delete',
      title:
        item.type !== 'notebook' && item.type !== 'note' ? 'Delete ' + item.type : 'Move to trash',
      icon: 'delete-outline',
      type: 'error',
      func: deleteItem
    },
    {
      name: 'PermDelete',
      title: 'Delete ' + item.itemType,
      icon: 'delete',
      func: deleteTrashItem
    },
    {
      name: 'ReadOnly',
      title: 'Read only',
      icon: 'pencil-lock',
      func: toggleReadyOnlyMode,
      on: item.readonly
    },
    {
      name: 'History',
      title: 'History',
      icon: 'history',
      func: openHistory
    },
    {
      name: 'Dark Mode',
      title: 'Dark mode',
      icon: 'theme-light-dark',
      func: switchTheme,
      switch: true,
      on: colors.night ? true : false,
      close: false,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.night
    }
  ];

  return actions;
};
