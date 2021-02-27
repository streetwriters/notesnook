import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Dimensions,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  openVault,
  sendNoteEditedEvent,
  ToastEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import PremiumService from '../../services/PremiumService';
import Sync from '../../services/Sync';
import {editing, toTXT} from '../../utils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme,
} from '../../utils/Colors';
import {db} from '../../utils/DB';
import {
  eOnNewTopicAdded,
  eOpenMoveNoteDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {deleteItems} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {opacity, pv, SIZE} from '../../utils/SizeUtils';
import {sleep, timeConverter} from '../../utils/TimeUtils';
import {PremiumTag} from '../Premium/PremiumTag';
import {PressableButton} from '../PressableButton';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {ActionSheetColorsSection} from './ActionSheetColorsSection';
import {ActionSheetTagsSection} from './ActionSheetTagsSection';
const w = Dimensions.get('window').width;

export const ActionSheetComponent = ({
  close = () => {},
  item,
  hasColors = false,
  hasTags = false,
  rowItems = [],
  columnItems = [],
  getRef,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, user} = state;
  const [refreshing, setRefreshing] = useState(false);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(false);
  const [note, setNote] = useState(item);
  const [noteInTopic, setNoteInTopic] = useState(
    editing.actionAfterFirstSave.type === 'topic' &&
      db.notebooks
        .notebook(editing.actionAfterFirstSave.notebook)
        .topics.topic(editing.actionAfterFirstSave.id)
        .has(item.id),
  );

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    dispatch({type: Actions.THEME, colors: newColors});
  }

  useEffect(() => {
    if (item.dateCreated !== null) {
      setNote({...item});
      if (item.type !== note) {
        setIsPinnedToMenu(db.settings.isPinned(note.id));
      }
    }
  }, [item]);

  const localRefresh = (type, nodispatch = false) => {
    if (!note || !note.id) return;
    let toAdd;

    switch (type) {
      case 'note': {
        toAdd = db.notes.note(note.id);
        if (toAdd) {
          toAdd = toAdd.data;
        } else {
          setTimeout(() => {
            toAdd = db.notes.note(note.id);
            if (toAdd) {
              toAdd = toAdd.data;
            }
          }, 500);
        }

        break;
      }
      case 'notebook': {
        toAdd = db.notebooks.notebook(note.id);
        if (toAdd) {
          toAdd = toAdd.data;
        } else {
          setTimeout(() => {
            toAdd = db.notebooks.notebook(note.id);
            if (toAdd) {
              toAdd = toAdd.data;
            }
          }, 500);
        }
        break;
      }
      case 'topic': {
        toAdd = db.notebooks.notebook(note.notebookId).topics.topic(note.title);

        break;
      }
    }
    if (!toAdd || !toAdd.id) return;

    if (!nodispatch) {
      dispatch({type: type});
      if (type === 'note') {
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
        ]);
      }
    }
    setNote({...toAdd});
  };

  const rowItemsData = [
    {
      name: 'Add to',
      icon: 'book-outline',
      func: () => {
        close();
        dispatch({type: Actions.CLEAR_SELECTION});
        dispatch({type: Actions.SELECTED_ITEMS, item: note});
        setTimeout(() => {
          eSendEvent(eOpenMoveNoteDialog, note);
        }, 300);
      },
    },
    {
      name: 'Share',
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
            description: 'Unlock note to share it.',
          });
        } else {
          let text = await db.notes.note(note.id).export('txt');
          let m = `${note.title}\n \n ${text}`;
          Share.open({
            title: 'Share note to',
            failOnCancel: false,
            message: m,
          });
        }
      },
    },
    {
      name: 'Export',
      icon: 'export',
      func: () => {
        close('export');
      },
    },
    {
      name: 'Delete',
      icon: 'delete',
      func: async () => {
        close();
        if (note.locked) {
      
          await sleep(300);
          openVault({
            deleteNote: true,
            novault: true,
            locked: true,
            item: note,
            title: 'Delete note',
            description: 'Unlock note to delete it.',
          });
        } else {
          try {
            close();
            await deleteItems(note);
          } catch (e) {
            //console.log(e);
          }
        }
      },
    },
    {
      name: 'Edit Notebook',
      icon: 'square-edit-outline',
      func: () => {
        close('notebook');
      },
    },
    {
      name: 'Edit Topic',
      icon: 'square-edit-outline',
      func: () => {
        close('topic');
      },
    },
    {
      name: 'Copy',
      icon: 'content-copy',
      func: async () => {
        if (note.locked) {
          openVault({
            copyNote: true,
            novault: true,
            locked: true,
            item: note,
            title: 'Copy note',
            description: 'Unlock note to copy to clipboard.',
          });
        } else {
          let text = await db.notes.note(note.id).content();
          text = toTXT(text);
          text = `${note.title}\n \n ${text}`;
          Clipboard.setString(text);
          ToastEvent.show({
            heading: 'Note copied to clipboard',
            type: 'success',
            context: 'local',
          });
        }
      },
    },
    {
      name: 'Restore',
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
          Navigation.routeNames.Trash,
        ]);
        type = note.type === 'trash' ? note.itemType : note.type;

        ToastEvent.show({
          heading:
            type === 'note'
              ? 'Note restored from trash'
              : 'Notebook restored from trash',
          type: 'success',
        });
    
      },
    },
    {
      name: 'Remove',
      icon: 'delete',
      func: () => {
        close('permanant_delete');
      },
    },
  ];

  const columnItemsData = [
    {
      name: 'Dark Mode',
      icon: 'theme-light-dark',
      func: () => {
        if (!colors.night) {
          MMKV.setStringAsync('theme', JSON.stringify({night: true}));
          changeColorScheme(COLOR_SCHEME_DARK);
        } else {
          MMKV.setStringAsync('theme', JSON.stringify({night: false}));
          changeColorScheme(COLOR_SCHEME_LIGHT);
        }
      },
      switch: true,
      on: colors.night ? true : false,
      close: false,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.night,
    },
    {
      name: 'Pin',
      icon: 'pin',
      func: async () => {
        if (!note.id) return;
        close();
        if (note.type === 'note') {
          if (db.notes.pinned.length === 3 && !note.pinned) {
            ToastEvent.show({
              heading: 'Cannot pin more than 3 notes',
              type: 'error',
              context: 'local',
            });
            return;
          }
          await db.notes.note(note.id).pin();
        } else {
          if (db.notebooks.pinned.length === 3 && !note.pinned) {
            ToastEvent.show({
              heading: 'Cannot pin more than 3 notebooks',
              type: 'error',
              context: 'local',
            });
            return;
          }
          await db.notebooks.notebook(note.id).pin();
        }
        localRefresh(item.type);
    
      },
      close: false,
      check: true,
      on: note.pinned,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.pin,
    },
    {
      name: 'Favorite',
      icon: 'star',
      func: async () => {
        if (!note.id) return;
        close();
        if (note.type === 'note') {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        dispatch({type: Actions.FAVORITES});
        sendNoteEditedEvent({
          id: note.id,
          forced: true,
        });
        localRefresh(item.type, true);
     
      },
      close: false,
      check: true,
      on: note.favorite,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.favorite,
      color: 'orange',
    },
    {
      name: isPinnedToMenu
        ? 'Remove Shortcut from Menu'
        : 'Add Shortcut to Menu',
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
                notebookId: note.notebookId,
              });
            } else {
              await db.settings.pin(note.type, {id: note.id});
            }
          }
          setIsPinnedToMenu(db.settings.isPinned(note.id));
          dispatch({type: Actions.MENU_PINS});
        } catch (e) {}

      },
      close: false,
      check: true,
      on: isPinnedToMenu,
      nopremium: true,
      id: notesnook.ids.dialogs.actionsheet.pinMenu,
    },
  ];

  const _renderRowItem = (rowItem) =>
    rowItems.includes(rowItem.name) ? (
      <TouchableOpacity
        onPress={rowItem.func}
        key={rowItem.name}
        testID={'icon-' + rowItem.name}
        style={{
          alignItems: 'center',
          width: DDS.isTab
            ? (400 - 24) / rowItems.length
            : (w - 25) / rowItems.length,
        }}>
        <Icon
          style={{
            width: 50,
            height: 40,
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            textAlignVertical: 'center',
            marginBottom: DDS.isTab ? 7 : 3.5,
          }}
          name={rowItem.icon}
          size={DDS.isTab ? SIZE.xl : SIZE.lg}
          color={rowItem.name === 'Delete' ? colors.errorText : colors.accent}
        />
        <Paragraph>{rowItem.name}</Paragraph>
      </TouchableOpacity>
    ) : null;

  const _renderColumnItem = (item) =>
    (note.id && columnItems.includes(item.name)) ||
    (item.name === 'Dark Mode' && columnItems.includes(item.name)) ? (
      <TouchableOpacity
        key={item.name}
        activeOpacity={opacity}
        testID={item.id}
        onPress={() => {
          item.func();
        }}
        style={{
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: pv,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 30,
            }}
            name={item.icon}
            color={item.color || colors.accent}
            size={SIZE.md}
          />
          <Paragraph>{item.name}</Paragraph>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          {item.switch ? (
            <Icon
              size={SIZE.lg + 2}
              color={item.on ? colors.accent : colors.icon}
              name={item.on ? 'toggle-switch' : 'toggle-switch-off'}
            />
          ) : undefined}

          {item.check ? (
            <Icon
              name={
                item.on
                  ? 'check-circle-outline'
                  : 'checkbox-blank-circle-outline'
              }
              color={item.on ? colors.accent : colors.icon}
              size={SIZE.lg + 2}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    ) : null;

  const onPressVaultButton = async () => {
    if (!note.id) return;
    if (note.locked) {
      close('unlock');
    } else {
      db.vault
        .add(note.id)
        .then((r) => {
          let n = db.notes.note(note.id).data;
          if (n.locked) {
            close();
          }
          sendNoteEditedEvent({
            id: note.id,
            forced: true,
          });
          localRefresh(note.type);
        })
        .catch(async (e) => {
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
  };

  const onScrollEnd = () => {
    getRef().current?.handleChildScrollEnd();
  };

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
        paddingBottom: 30,
        backgroundColor: colors.bg,
        paddingHorizontal: 0,
        borderBottomRightRadius: DDS.isLargeTablet() ? 10 : 1,
        borderBottomLeftRadius: DDS.isLargeTablet() ? 10 : 1,
      }}>
      <TouchableOpacity
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
        onPress={() => {
          Keyboard.dismiss();
        }}
      />
      {!note || !note.id ? (
        <Paragraph style={{marginVertical: 10, alignSelf: 'center'}}>
          Start writing to save your note.
        </Paragraph>
      ) : (
        <View
          style={{
            paddingHorizontal: 12,
            alignItems: 'center',
            marginVertical: 10,
          }}>
          <Heading size={SIZE.md}>{note?.title.replace('\n', '')}</Heading>

          <Paragraph
            numberOfLines={2}
            style={{
              width: '100%',
              textAlign: 'center',
              maxWidth: '100%',
            }}>
            {note.type === 'notebook' && note.description
              ? note.description
              : null}
            {note.type === 'note' && item.headline
              ? note.headline[item.headline.length - 1] === '\n'
                ? note.headline.slice(0, note.headline.length - 1)
                : note.headline
              : null}
          </Paragraph>

          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              textAlignVertical: 'center',
              marginTop: 2.5,
            }}>
            {note.type === 'note'
              ? 'Last edited on ' + timeConverter(note.dateEdited)
              : null}
            {note.type !== 'note' && !note.dateDeleted
              ? 'Created on ' + timeConverter(note.dateCreated)
              : null}
            {note.dateDeleted
              ? 'Deleted on ' + timeConverter(note.dateDeleted)
              : null}
          </Paragraph>

          {note.type === 'notebook' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '90%',
                maxWidth: '90%',
                flexWrap: 'wrap',
              }}>
              {note && note.topics && note.topics.length > 0
                ? note.topics
                    .slice()
                    .sort((a, b) => a.dateEdited - b.dateEdited)
                    .slice(0, 6)
                    .map((topic) => (
                      <View
                        key={topic.id}
                        style={{
                          borderRadius: 2.5,
                          backgroundColor: colors.accent,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                          marginRight: 5,
                          marginVertical: 2.5,
                        }}>
                        <Paragraph
                          size={SIZE.xs}
                          numberOfLines={1}
                          color="white"
                          style={{
                            maxWidth: '100%',
                          }}>
                          {topic.title.length > 16
                            ? topic.title.slice(0, 16) + '...'
                            : topic.title}
                        </Paragraph>
                      </View>
                    ))
                : null}
            </View>
          )}

          {note.type !== 'note' || refreshing ? null : (
            <TouchableOpacity
              activeOpacity={0.9}
              testID={notesnook.ids.dialogs.actionsheet.sync}
              onPress={async () => await Sync.run('local')}
              style={{
                borderColor: colors.accent,
                paddingHorizontal: 5,
                borderRadius: 2.5,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 5,
                borderWidth: 1,
                height: 18,
              }}>
              <Paragraph
                color={colors.accent}
                size={SIZE.xs}
                style={{
                  textAlignVertical: 'center',
                  textAlign: 'center',
                }}>
                {user && user.lastSynced > note.dateEdited
                  ? 'Synced'
                  : 'Sync Now'}
              </Paragraph>
            </TouchableOpacity>
          )}

          {refreshing ? (
            <ActivityIndicator
              style={{marginTop: 5, height: 20}}
              size={12}
              color={colors.accent}
            />
          ) : null}
        </View>
      )}

      {note.id || note.dateCreated ? (
        <View
          style={{
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            flexDirection: 'row',
            paddingHorizontal: 12,
          }}>
          {rowItemsData.map(_renderRowItem)}
        </View>
      ) : null}

      {note.type === 'note' ? (
        <PressableButton
          type={note.locked ? 'accent' : 'shade'}
          accentColor="red"
          customSelectedColor={note.locked && '#ff0000'}
          customOpacity={note.locked && 0.12}
          onPress={onPressVaultButton}
          testID={notesnook.ids.dialogs.actionsheet.vault}
          customStyle={{
            width: '95%',
            alignSelf: 'center',
            height: 50,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Icon
            name={note.locked ? 'shield-off' : 'shield'}
            color={note.locked ? '#FF0000' : colors.accent}
            size={SIZE.md}
          />
          <Paragraph
            color={note.locked ? '#FF0000' : colors.accent}
            size={SIZE.md}
            style={{
              marginLeft: 5,
            }}>
            {note.locked ? 'Remove from Vault' : 'Add to Vault'}
          </Paragraph>
        </PressableButton>
      ) : null}

      {noteInTopic ? (
        <PressableButton
          type="accent"
          accentColor="red"
          customSelectedColor="#ff0000"
          customOpacity={0.12}
          onPress={async () => {
            await db.notebooks
              .notebook(editing.actionAfterFirstSave.notebook)
              .topics.topic(editing.actionAfterFirstSave.id)
              .delete(note.id);
            Navigation.setRoutesToUpdate([
              Navigation.routeNames.Notebooks,
              Navigation.routeNames.Notes,
              Navigation.routeNames.NotesPage,
              Navigation.routeNames.Notebook,
            ]);
            setNote(db.notes.note(note.id).data);
            close();
          }}
          testID={notesnook.ids.dialogs.actionsheet.vault}
          customStyle={{
            width: '95%',
            alignSelf: 'center',
            height: 50,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
          }}>
          <Paragraph color="#FF0000" size={SIZE.md}>
            Remove from Topic
          </Paragraph>
        </PressableButton>
      ) : null}

      {hasColors && note.id ? (
        <ActionSheetColorsSection close={close} item={note} />
      ) : null}

      {hasTags && note ? (
        <ActionSheetTagsSection
          close={close}
          item={note}
          localRefresh={localRefresh}
        />
      ) : null}

      {columnItems.length > 0 ? (
        <View>{columnItemsData.map(_renderColumnItem)}</View>
      ) : null}

      {DDS.isTab ? (
        <View
          style={{
            height: 20,
          }}
        />
      ) : null}
    </ScrollView>
  );
};
