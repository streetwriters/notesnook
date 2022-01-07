import Clipboard from '@react-native-clipboard/clipboard';
import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  useMenuStore,
  useSelectionStore,
  useSettingStore,
  useTagStore,
  useUserStore
} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
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
import {deleteItems, openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import {presentDialog} from '../Dialog/functions';
import NoteHistory from '../NoteHistory';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {ColorTags} from './color-tags';
import {DateMeta} from './date-meta';
import { DevMode } from './dev-mode';
import Notebooks from './notebooks';
import {Synced} from './synced';
import {Tags} from './tags';
import {Topics} from './topics';
const w = Dimensions.get('window').width;

let htmlToText;
export const Properties = ({
  close = () => {},
  item,
  hasColors = false,
  hasTags = false,
  rowItems = [],
  getRef
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const clearSelection = useSelectionStore(state => state.clearSelection);
  const setSelectedItem = useSelectionStore(state => state.setSelectedItem);
  const setMenuPins = useMenuStore(state => state.setMenuPins);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.settings.isPinned(item.id)
  );
  const [note, setNote] = useState(item);
  const user = useUserStore(state => state.user);
  const [notifPinned, setNotifPinned] = useState(null);
  const dimensions = useSettingStore(state => state.dimensions);
  const alias =
    note.type === 'tag'
      ? db.tags.alias(note.id)
      : note.type === 'color'
      ? db.colors.alias(note.id)
      : note.title;

  const isPublished =item.type === "note" && db.monographs.isPublished(note.id);
  const noteInTopic = item.type === "note" &&
    editing.actionAfterFirstSave.type === 'topic' &&
    db.notebooks
      .notebook(editing.actionAfterFirstSave.notebook)
      .topics.topic(editing.actionAfterFirstSave.id)
      .has(item.id);

  useEffect(() => {
    if (item.id === null) return;
    checkNotifPinned();
    if (item.type !== 'note') {
      setIsPinnedToMenu(db.settings.isPinned(note.id));
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

  const localRefresh = (type, nodispatch = false) => {
    if (!note || !note.id) return;
    let _item;

    switch (type) {
      case 'note': {
        _item = db.notes.note(note.id)?.data;
        break;
      }
      case 'notebook': {
        _item = db.notebooks.notebook(note.id)?.data;
        break;
      }
      case 'topic': {
        _item = db.notebooks.notebook(note.notebookId).topics.topic(note.title);
        break;
      }
    }
    if (!_item || !_item.id) return;

    if (!nodispatch) {
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes,
        Navigation.routeNames.Notebooks,
        Navigation.routeNames.Notebook,
        Navigation.routeNames.Tags,
        Navigation.routeNames.Trash
      ]);
    }

    setNote({..._item});
  };

  const rowItemsData = [
    {
      name: 'Dark Mode',
      title: 'Dark mode',
      icon: 'theme-light-dark',
      func: () => {
        if (!colors.night) {
          MMKV.setStringAsync('theme', JSON.stringify({night: true}));
          changeColorScheme(
            SettingsService.get().pitchBlack
              ? COLOR_SCHEME_PITCH_BLACK
              : COLOR_SCHEME_DARK
          );
        } else {
          MMKV.setStringAsync('theme', JSON.stringify({night: false}));
          changeColorScheme(COLOR_SCHEME_LIGHT);
        }
      },
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
      func: () => {
        close();
        clearSelection(true);
        setSelectedItem(note);
        setTimeout(() => {
          eSendEvent(eOpenMoveNoteDialog, note);
        }, 300);
      }
    },
    {
      name: 'Pin',
      title: note.pinned ? 'Unpin' : 'Pin to top',
      icon: note.pinned ? 'pin-off-outline' : 'pin-outline',
      func: async () => {
        if (!note.id) return;
        close();
        let type = note.type;
        if (db[`${type}s`].pinned.length === 3 && !note.pinned) {
          ToastEvent.show({
            heading: `Cannot pin more than 3 ${type}s`,
            type: 'error'
          });
          return;
        }
        await db[`${type}s`][type](note.id).pin();
        localRefresh(item.type);
      },
      close: false,
      check: true,
      on: note.pinned,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.pin
    },
    {
      name: 'Favorite',
      title: !note.favorite ? 'Favorite' : 'Unfavorite',
      icon: note.favorite ? 'star-off' : 'star-outline',
      func: async () => {
        if (!note.id) return;
        close();
        if (note.type === 'note') {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Notes
        ]);
        localRefresh(item.type, true);
      },
      close: false,
      check: true,
      on: note.favorite,
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
      func: async () => {
        if (Platform.OS === 'ios') return;
        if (notifPinned !== null) {
          Notifications.remove(note.id, notifPinned.identifier);
          await sleep(1000);
          await Notifications.get();
          checkNotifPinned();
          return;
        }
        if (note.locked) return;
        let text = await db.notes.note(note.id).content();
        htmlToText = htmlToText || require('html-to-text');
        text = htmlToText.convert(text, {
          selectors: [{selector: 'img', format: 'skip'}]
        });
        Notifications.present({
          title: note.title,
          message: note.headline,
          subtitle: note.headline,
          bigText: text,
          ongoing: true,
          actions: ['UNPIN'],
          tag: note.id
        });
        await sleep(1000);
        await Notifications.get();
        checkNotifPinned();
      }
    },

    {
      name: 'Edit Notebook',
      title: 'Edit notebook',
      icon: 'square-edit-outline',
      func: () => {
        close('notebook');
      }
    },
    {
      name: 'Edit Topic',
      title: 'Edit topic',
      icon: 'square-edit-outline',
      func: () => {
        close('topic');
      }
    },
    {
      name: 'Copy',
      title: 'Copy',
      icon: 'content-copy',
      func: async () => {
        if (note.locked) {
          openVault({
            copyNote: true,
            novault: true,
            locked: true,
            item: note,
            title: 'Copy note',
            description: 'Unlock note to copy to clipboard.'
          });
        } else {
          let text = await db.notes.note(note.id).content();
          htmlToText = htmlToText || require('html-to-text');
          text = htmlToText.convert(text, {
            selectors: [{selector: 'img', format: 'skip'}]
          });
          text = `${note.title}\n \n ${text}`;
          Clipboard.setString(text);
          ToastEvent.show({
            heading: 'Note copied to clipboard',
            type: 'success',
            context: 'local'
          });
        }
      }
    },
    {
      name: 'Restore',
      title: 'Restore ' + note.itemType,
      icon: 'delete-restore',
      func: async () => {
        close();
        await db.trash.restore(note.id);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Tags,
          Navigation.routeNames.Notes,
          Navigation.routeNames.Notebooks,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Trash
        ]);
        type = note.type === 'trash' ? note.itemType : note.type;

        ToastEvent.show({
          heading:
            type === 'note'
              ? 'Note restored from trash'
              : 'Notebook restored from trash',
          type: 'success'
        });
      }
    },

    {
      name: 'Publish',
      title: isPublished ? 'Published' : 'Publish',
      icon: 'cloud-upload-outline',
      on: isPublished,
      func: async () => {
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
            heading: 'Email not verified',
            message: 'Please verify your email first.',
            context: 'local'
          });
          return;
        }
        if (note.locked) {
          ToastEvent.show({
            heading: 'Locked notes cannot be published',
            type: 'error',
            context: 'local'
          });
          return;
        }
        close();
        await sleep(300);
        eSendEvent(eOpenPublishNoteDialog, note);
      }
    },
    {
      name: 'Vault',
      title: note.locked ? 'Remove from vault' : 'Add to vault',
      icon: note.locked ? 'shield-off-outline' : 'shield-outline',
      func: async () => {
        if (!note.id) return;
        if (note.locked) {
          close('unlock');
        } else {
          db.vault
            .add(note.id)
            .then(r => {
              let n = db.notes.note(note.id).data;
              if (n.locked) {
                close();
              }
              Navigation.setRoutesToUpdate([
                Navigation.routeNames.NotesPage,
                Navigation.routeNames.Favorites,
                Navigation.routeNames.Notes
              ]);
              localRefresh(note.type);
            })
            .catch(async e => {
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
            });
        }
      },
      on: note.locked
    },

    {
      name: 'Add Shortcut',
      title: isPinnedToMenu ? 'Remove Shortcut' : 'Add Shortcut',
      icon: isPinnedToMenu ? 'link-variant-remove' : 'link-variant',
      func: async () => {
        close();
        try {
          if (isPinnedToMenu) {
            await db.settings.unpin(note.id);
          } else {
            if (item.type === 'topic') {
              await db.settings.pin(note.type, {
                id: note.id,
                notebookId: note.notebookId
              });
            } else {
              await db.settings.pin(note.type, {id: note.id});
            }
          }
          setIsPinnedToMenu(db.settings.isPinned(note.id));
          setMenuPins();
        } catch (e) {}
      },
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
      func: async () => {
        close();
        await sleep(300);
        presentDialog({
          title: 'Rename tag',
          paragraph: 'Change the title of the tag ' + alias,
          positivePress: async value => {
            if (!value || value === '' || value.trimStart().length == 0) return;
            await db.tags.rename(note.id, db.tags.sanitize(value));
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
    },
    {
      name: 'Share',
      title: 'Share',
      icon: 'share-variant',
      func: async () => {
        if (note.locked) {
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
          let text = await db.notes.note(note.id).export('txt');
          let m = `${note.title}\n \n ${text}`;
          Share.open({
            title: 'Share note to',
            failOnCancel: false,
            message: m
          });
        }
      }
    },
    {
      name: 'Attachments',
      title: 'Attachments',
      icon: 'attachment',
      func: async () => {
        close();
        await sleep(300);
        eSendEvent(eOpenAttachmentsDialog, note);
      }
    },
    {
      name: 'Export',
      title: 'Export',
      icon: 'export',
      func: () => {
        close('export');
      }
    },
    {
      name: 'RemoveTopic',
      title: 'Remove from topic',
      hidden: !noteInTopic,
      icon: 'minus-circle-outline',
      func: async () => {
        await db.notebooks
          .notebook(editing.actionAfterFirstSave.notebook)
          .topics.topic(editing.actionAfterFirstSave.id)
          .delete(note.id);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notebooks,
          Navigation.routeNames.Notes,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Notebook
        ]);
        setNote(db.notes.note(note.id).data);
        close();
      }
    },
    {
      name: 'Delete',
      title:
        note.type !== 'notebook' && note.type !== 'note'
          ? 'Delete ' + item.type
          : 'Move to trash',
      icon: 'delete-outline',
      type: 'error',
      func: async () => {
        close();
        if (note.type === 'tag') {
          await sleep(300);
          presentDialog({
            title: 'Delete tag',
            paragraph: 'This tag will be removed from all notes.',
            positivePress: async value => {
              await db.tags.remove(note.id);
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
        if (note.locked) {
          await sleep(300);
          openVault({
            deleteNote: true,
            novault: true,
            locked: true,
            item: note,
            title: 'Delete note',
            description: 'Unlock note to delete it.'
          });
        } else {
          try {
            close();
            await deleteItems(note);
          } catch (e) {}
        }
      }
    },
    {
      name: 'PermDelete',
      title: 'Delete ' + note.itemType,
      icon: 'delete',
      func: async () => {
        close();
        await sleep(300);
        presentDialog({
          title: `Permanent delete`,
          paragraph: `Are you sure you want to delete this ${note.itemType} permanantly from trash?`,
          positiveText: 'Delete',
          negativeText: 'Cancel',
          positivePress: async () => {
            await db.trash.delete(note.id);
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
    },
    {
      name: 'History',
      title: 'History',
      icon: 'history',
      func: async () => {
        close();
        await sleep(300);
        presentSheet({
          noProgress: true,
          noIcon: true,
          component: ref => <NoteHistory ref={ref} note={note} />
        });
      }
    }
  ];

  let width = dimensions.width > 600 ? 600 : 500;
  let columnItemsCount = DDS.isLargeTablet() ? 7 : 5;
  let columnItemWidth = DDS.isTab
    ? (width - 24) / columnItemsCount
    : (w - 24) / columnItemsCount;

  const _renderRowItem = rowItem => (
    <View
      onPress={rowItem.func}
      key={rowItem.name}
      testID={'icon-' + rowItem.name}
      style={{
        alignItems: 'center',
        width: columnItemWidth,
        marginBottom: 10
      }}>
      <PressableButton
        onPress={rowItem.func}
        type={rowItem.on ? 'shade' : 'grayBg'}
        customStyle={{
          height: columnItemWidth - 12,
          width: columnItemWidth - 12,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          textAlignVertical: 'center',
          marginBottom: DDS.isTab ? 7 : 3.5
        }}>
        <Icon
          name={rowItem.icon}
          size={DDS.isTab ? SIZE.xxl : SIZE.lg}
          color={
            rowItem.on
              ? colors.accent
              : rowItem.name === 'Delete' || rowItem.name === 'PermDelete'
              ? colors.errorText
              : colors.icon
          }
        />
      </PressableButton>

      <Paragraph size={SIZE.xs + 1} style={{textAlign: 'center'}}>
        {rowItem.title}
      </Paragraph>
    </View>
  );

  const onScrollEnd = () => {
    getRef().current?.handleChildScrollEnd();
  };

  const renderColumnItem = ({item, index}) => (
    <Button
      buttonType={{
        text: item.on
          ? colors.accent
          : item.name === 'Delete' || item.name === 'PermDelete'
          ? colors.errorText
          : colors.pri
      }}
      onPress={item.func}
      title={item.title}
      icon={item.icon}
      type={item.on ? 'shade' : 'gray'}
      fontSize={SIZE.sm}
      style={{
        borderRadius: 0,
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
        width: '100%'
      }}
    />
  );

  return (
    <ScrollView
      nestedScrollEnabled
      onScrollEndDrag={onScrollEnd}
      onScrollAnimationEnd={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      onLayout={() => {
        if (!item.dateDeleted) {
          localRefresh(item.type, true);
        }
      }}
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 0,
        borderBottomRightRadius: DDS.isLargeTablet() ? 10 : 1,
        borderBottomLeftRadius: DDS.isLargeTablet() ? 10 : 1
      }}>
      {!note || !note.id ? (
        <Paragraph style={{marginVertical: 10, alignSelf: 'center'}}>
          Start writing to save your note.
        </Paragraph>
      ) : (
        <View
          style={{
            marginTop: 5,
            zIndex: 10
          }}>
          <View
            style={{
              paddingHorizontal: 12
            }}>
            <Heading size={SIZE.lg}>
              {note.type === 'tag' ? '#' : null}
              {alias}
            </Heading>

            {note.headline || note.description ? (
              <Paragraph numberOfLines={2} color={colors.icon}>
                {(note.type === 'notebook' || note.itemType === 'notebook') &&
                note?.description
                  ? note.description
                  : null}
                {(note.type === 'note' || note.itemType === 'note') &&
                note?.headline
                  ? note.headline
                  : null}
              </Paragraph>
            ) : null}

            {hasTags && note && note.type === 'note' ? (
              <Tags close={close} item={note} localRefresh={localRefresh} />
            ) : null}

            <Topics item={note} close={close} />
          </View>

          {note && note.type === 'note' ? (
            <Notebooks note={note} close={close} />
          ) : null}

          <DateMeta item={note} />
        </View>
      )}

      <View
        style={{
          borderTopWidth: 1,
          borderColor: colors.nav
        }}
      />

      {hasColors && note.id ? <ColorTags close={close} item={note} /> : null}

      {note.id ? (
        <>
          {note.type === 'note' ? (
            <FlatList
              data={rowItemsData.filter(
                i => rowItems.indexOf(i.name) > -1 && !i.hidden
              )}
              keyExtractor={item => item.title}
              numColumns={
                rowItems.length < 5 ? rowItems.length : columnItemsCount
              }
              style={{
                marginTop: note.type !== 'note' ? 10 : 0,
                paddingTop: 10
              }}
              columnWrapperStyle={{
                justifyContent: 'flex-start'
              }}
              contentContainerStyle={{
                alignSelf: 'center',
                width: rowItems.length < 5 ? '100%' : null,
                paddingLeft: rowItems.length < 5 ? 10 : 0
              }}
              renderItem={({item, index}) => _renderRowItem(item)}
            />
          ) : (
            <FlatList
              data={rowItemsData.filter(
                i => rowItems.indexOf(i.name) > -1 && !i.hidden
              )}
              keyExtractor={item => item.title}
              renderItem={renderColumnItem}
            />
          )}
        </>
      ) : null}

      <Synced item={item} close={close} />

      <DevMode item={item}/>


      {DDS.isTab ? (
        <View
          style={{
            height: 20
          }}
        />
      ) : null}
    </ScrollView>
  );
};
