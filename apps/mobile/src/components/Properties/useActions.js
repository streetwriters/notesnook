import Clipboard from '@react-native-clipboard/clipboard';
import React, {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import Share from 'react-native-share';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  useMenuStore,
  useSelectionStore,
  useTagStore,
  useUserStore
} from '../../provider/stores';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import Notifications from '../../services/Notifications';
import SettingsService from '../../services/SettingsService';
import {editing} from '../../utils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme
} from '../../utils/Colors';
import {db} from '../../utils/database';
import {
  eOpenAttachmentsDialog,
  eOpenLoginDialog,
  eOpenMoveNoteDialog,
  eOpenPublishNoteDialog
} from '../../utils/Events';
import {deleteItems} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {sleep} from '../../utils/TimeUtils';
import {presentDialog} from '../Dialog/functions';
import NoteHistory from '../NoteHistory';

let htmlToText;
export const useActions = ({close = () => {}, item}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const clearSelection = useSelectionStore(state => state.clearSelection);
  const setSelectedItem = useSelectionStore(state => state.setSelectedItem);
  const setMenuPins = useMenuStore(state => state.setMenuPins);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.settings.isPinned(item.id)
  );

  const user = useUserStore(state => state.user);
  const [notifPinned, setNotifPinned] = useState(null);
  const alias =
    item.type === 'tag'
      ? db.tags.alias(item.id)
      : item.type === 'color'
      ? db.colors.alias(item.id)
      : item.title;

  const isPublished =
    item.type === 'note' && db.monographs.isPublished(item.id);
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

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    dispatch({type: Actions.THEME, colors: newColors});
  }

  function switchTheme() {
    if (!colors.night) {
      MMKV.setStringAsync('theme', JSON.stringify({night: true}));
      let nextTheme = SettingsService.get().pitchBlack
        ? COLOR_SCHEME_PITCH_BLACK
        : COLOR_SCHEME_DARK;
      changeColorScheme(nextTheme);
      return;
    }
    MMKV.setStringAsync('theme', JSON.stringify({night: false}));
    changeColorScheme(COLOR_SCHEME_LIGHT);
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
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notebooks,
      Navigation.routeNames.Notes
    ]);
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
    let text = await db.notes.note(item.id).content();
    htmlToText = htmlToText || require('html-to-text');
    text = htmlToText.convert(text, {
      selectors: [{selector: 'img', format: 'skip'}]
    });
    Notifications.present({
      title: item.title,
      message: item.headline,
      subtitle: item.headline,
      bigText: text,
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
    type = item.type === 'trash' ? item.itemType : item.type;
    ToastEvent.show({
      heading:
        type === 'note'
          ? 'Note restored from trash'
          : 'Notebook restored from trash',
      type: 'success'
    });
  }

  async function copyContent() {
    if (item.locked) {
      openVault({
        copyNote: true,
        novault: true,
        locked: true,
        item: item,
        title: 'Copy note',
        description: 'Unlock note to copy to clipboard.'
      });
    } else {
      let text = await db.notes.note(item.id).content();
      htmlToText = htmlToText || require('html-to-text');
      text = htmlToText.convert(text, {
        selectors: [{selector: 'img', format: 'skip'}]
      });
      text = `${item.title}\n \n ${text}`;
      Clipboard.setString(text);
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

    if (!user.isEmailConfirmed) {
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
      close('unlock');
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
      switch (e.message) {
        case db.vault.ERRORS.noVault:
          close('novault');
          break;
        case db.vault.ERRORS.vaultLocked:
          close('locked');
          break;
        case db.vault.ERRORS.wrongPassword:
          close();
          break;
      }
    }
  }

  async function createMenuShortcut() {
    close();
    try {
      if (isPinnedToMenu) {
        await db.settings.unpin(item.id);
        return;
      } else {
        if (item.type === 'topic') {
          await db.settings.pin(item.type, {
            id: item.id,
            notebookId: item.notebookId
          });
        } else {
          await db.settings.pin(item.type, {id: item.id});
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
      openVault({
        item: item,
        novault: true,
        locked: true,
        share: true,
        title: 'Share note',
        description: 'Unlock note to share it.'
      });
    } else {
      let text = await db.notes.note(item.id).export('txt');
      let m = `${item.title}\n \n ${text}`;
      Share.open({
        title: 'Share note to',
        failOnCancel: false,
        message: m
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
      noProgress: true,
      noIcon: true,
      component: ref => <NoteHistory ref={ref} note={item} />
    });
  }

  async function showAttachments() {
    close();
    await sleep(300);
    eSendEvent(eOpenAttachmentsDialog, item);
  }

  const actions = [
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
    },
    {
      name: 'Add to notebook',
      title: 'Add to notebook',
      icon: 'book-outline',
      func: addTo
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
      title:
        notifPinned !== null
          ? 'Unpin from Notifications'
          : 'Pin to Notifications',
      icon: 'bell',
      on: notifPinned !== null,
      func: pinToNotifications
    },

    {
      name: 'Edit Notebook',
      title: 'Edit notebook',
      icon: 'square-edit-outline',
      func: () => close('notebook')
    },
    {
      name: 'Edit Topic',
      title: 'Edit topic',
      icon: 'square-edit-outline',
      func: () => close('topic')
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
      func: () => close('export')
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
        item.type !== 'notebook' && item.type !== 'note'
          ? 'Delete ' + item.type
          : 'Move to trash',
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
      name: 'History',
      title: 'History',
      icon: 'history',
      func: openHistory
    }
  ];

  return actions
};
