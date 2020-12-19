import React, {useEffect, useState} from 'react';
import {Keyboard} from 'react-native';
import {ScrollView} from 'react-native';
import {
  ActivityIndicator,
  Clipboard,
  Dimensions,
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
import PremiumService from '../../services/PremiumService';
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
  eOpenLoginDialog,
  eOpenMoveNoteDialog,
  eShowGetPremium,
  refreshNotesPage,
} from '../../utils/Events';
import {deleteItems} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {opacity, ph, pv, SIZE} from '../../utils/SizeUtils';
import {timeConverter} from '../../utils/TimeUtils';
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
}) => {
  const [state, dispatch] = useTracked();
  const {colors, premiumUser, user} = state;
  const [refreshing, setRefreshing] = useState(false);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(false);

  const [note, setNote] = useState(
    item
      ? item
      : {
          colors: [],
          tags: [],
          pinned: false,
          favorite: false,
          locked: false,
          content: {
            text: null,
            delta: null,
          },
          dateCreated: null,
        },
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
        eSendEvent(refreshNotesPage);
      }
      dispatch({type: Actions.FAVORITES});
    }
    setNote({...toAdd});
  };

  const rowItemsData = [
    {
      name: 'Add to',
      icon: 'book-outline',
      func: () => {
        dispatch({type: Actions.CLEAR_SELECTION});
        dispatch({type: Actions.SELECTED_ITEMS, item: note});
        close();
        setTimeout(() => {
          eSendEvent(eOpenMoveNoteDialog, note);
        }, 400);
      },
    },
    {
      name: 'Share',
      icon: 'share-variant',
      func: async () => {
        if (note.locked) {
          openVault({
            item: item,
            novault: true,
            locked: true,
            share: true,
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
        try {
          await deleteItems(note);
        } catch (e) {
          console.log(e);
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
          });
        } else {
          let text = await db.notes.note(note.id).content();
          text = toTXT(text);
          text = `${note.title}\n \n ${text}`;
          Clipboard.setString(text);
          ToastEvent.show('Note copied to clipboard', 'success', 'local');
        }
      },
    },
    {
      name: 'Restore',
      icon: 'delete-restore',
      func: async () => {
        await db.trash.restore(note.id);
        dispatch({type: Actions.TRASH});
        dispatch({type: note.itemType});
        dispatch({type: Actions.FAVORITES});
        eSendEvent(refreshNotesPage);
        ToastEvent.show(
          item.type === 'note' ? 'Note restored' : 'Notebook restored',
          'success',
        );
        close();
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
      icon: 'tag-outline',
      func: async () => {
        if (!note.id) return;
        if (note.type === 'note') {
          if (db.notes.pinned.length === 3) {
            ToastEvent.show(
              'You cannot pin more than 3 notes',
              'error',
              'local',
            );
            return;
          }
          await db.notes.note(note.id).pin();
        } else {
          if (db.notebooks.pinned.length === 3) {
            ToastEvent.show(
              'You cannot pin more than 3 notes',
              'error',
              'local',
            );
            return;
          }
          await db.notebooks.notebook(note.id).pin();
        }
        localRefresh(item.type);
      },
      close: false,
      check: true,
      on: note.pinned,
      id: notesnook.ids.dialogs.actionsheet.pin,
    },
    {
      name: 'Favorite',
      icon: 'star',
      func: async () => {
        if (!note.id) return;
        if (note.type === 'note') {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        dispatch({type: Actions.FAVORITES});
        sendNoteEditedEvent(note.id, false, true);
        localRefresh(item.type, true);
      },
      close: false,
      check: true,
      on: note.favorite,
      id: notesnook.ids.dialogs.actionsheet.favorite,
    },
    {
      name: isPinnedToMenu ? 'Unpin from Menu' : 'Pin to Menu',
      icon: 'tag-outline',
      func: async () => {
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
            color={colors.pri}
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

          {item.nopremium ? null : <PremiumTag pro={premiumUser} />}

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

  const onPressSync = async () => {
    setRefreshing(true);
    try {
      await db.sync();
      localRefresh();
      ToastEvent.show('Sync Complete!', 'success', 'local');
    } catch (e) {
      if (e.message === 'You need to login to sync.') {
        ToastEvent.show(
          e.message,
          'error',
          'local',
          5000,
          () => {
            eSendEvent(eOpenLoginDialog);
          },
          'Login',
        );
      } else {
        ToastEvent.show(e.message, 'error', 'local', 5000);
      }
    } finally {
      dispatch({type: Actions.LAST_SYNC, lastSync: await db.lastSynced()});
      dispatch({type: Actions.ALL});
      setRefreshing(false);
    }
  };

  const onPressVaultButton = async () => {
    if (!note.id) return;
    if (note.locked) {
      close('unlock');
    } else {
      db.vault
        .add(note.id)
        .then(() => {
          sendNoteEditedEvent(note.id, false, true);
          if (note.locked && PremiumService.get()) {
            close();
          }
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

  return (
    <ScrollView
      onLayout={() => {
        if (!item.dateDeleted) {
          localRefresh(item.type, true);
        }
      }}
      style={{
        paddingBottom: 30,
        backgroundColor: colors.bg,
        paddingHorizontal: 0,
        borderBottomRightRadius:DDS.isLargeTablet()? 10 : 1,
        borderBottomLeftRadius:DDS.isLargeTablet()? 10 : 1
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
      {!note.id && !note.dateCreated ? (
        <Paragraph style={{marginVertical: 10}}>
          Start writing to save your note.
        </Paragraph>
      ) : (
        <View
          style={{
            paddingHorizontal: 12,
            alignItems: 'center',
            marginVertical: 10,
          }}>
          <Heading size={SIZE.md}>{note.title.replace('\n', '')}</Heading>

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
            {note.type === 'note'
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

          {note.type !== 'notebook' ? null : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '100%',
                flexWrap: 'wrap',
              }}>
              {note && note.topics
                ? note.topics.slice(1, 4).map((topic) => (
                    <View
                      key={topic.dateCreated.toString() + topic.title}
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
                        {topic.title}
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
              onPress={onPressSync}
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
          accentColor="errorBg"
          type={note.locked ? 'accent' : 'shade'}
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

      {editing.actionAfterFirstSave.type === 'topic' &&
      note.notebooks &&
      note.notebooks.findIndex(
        (o) => o.id === editing.actionAfterFirstSave.id,
      ) ? (
        <PressableButton
          accentColor="errorBg"
          customColor="#ff0000"
          customSelectedColor="#ff0000"
          customOpacity={0.12}
          onPress={async () => {
            await db.notebooks
              .notebook(editing.actionAfterFirstSave.notebook)
              .topics.topic(editing.actionAfterFirstSave.id)
              .delete(note.id);

            eSendEvent(refreshNotesPage);
            eSendEvent(eOnNewTopicAdded);
            dispatch({type: Actions.NOTEBOOKS});
            dispatch({type: Actions.NOTES});
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

      {hasTags ? (
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
      <Toast context="local" />
    </ScrollView>
  );
};
