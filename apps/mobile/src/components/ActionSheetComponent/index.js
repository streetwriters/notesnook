import React, {createRef, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Dimensions,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  openVault,
  sendNoteEditedEvent,
  ToastEvent,
} from '../../services/EventManager';
import {
  eOnNoteEdited,
  eOpenLoginDialog,
  eOpenMoveNoteDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {PremiumTag} from '../Premium/PremiumTag';
import {PressableButton} from '../PressableButton';
import {Toast} from '../Toast';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';
import {timeConverter} from '../../utils/TimeUtils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  COLORS_NOTE,
  setColorScheme,
} from '../../utils/Colors';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {DDS} from '../../services/DeviceDetection';
import {MMKV} from '../../utils/mmkv';
import { ActionSheetTagsSection } from './ActionSheetTagsSection';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;


export const ActionSheetComponent = ({
  close = () => {},
  item,
  hasColors = false,
  hasTags = false,
  rowItems = [],
  columnItems = [],
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser, user} = state;

  const [refreshing, setRefreshing] = useState(false);
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
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');

    dispatch({type: Actions.THEME, colors: newColors});
  }

  useEffect(() => {
    if (item.dateCreated !== null) {
      setNote({...item});
    }
  }, [item]);

  let tagToAdd = null;
  let backPressCount = 0;



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
      dispatch({type: Actions.FAVORITES});
    }
    setNote({...toAdd});
  };

  const rowItemsData = [
    {
      name: 'Add to',
      icon: 'book-outline',
      func: () => {
        dispatch({type: Actions.MODAL_NAVIGATOR, enabled: true});
        dispatch({type: Actions.SELECTED_ITEMS, item: note});
        close();
        setTimeout(() => {
          eSendEvent(eOpenMoveNoteDialog);
        }, 400);
      },
    },
    {
      name: 'Share',
      icon: 'share-variant',
      func: () => {
        if (note.locked) {
          openVault(item, false, true, false, false, true);
        } else {
          close();
          let m = `${note.title}\n \n ${note.content.text}`;

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
      func: () => close('delete'),
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
        let text = await db.notes.note(note.id).text();
        Clipboard.setString(text);
        ToastEvent.show('Note copied to clipboard', 'success', 'local');
      },
    },
    {
      name: 'Restore',
      icon: 'delete-restore',
      func: async () => {
        dispatch({type: Actions.TRASH});
        localRefresh(note.type);
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
    },
    {
      name: 'Pin',
      icon: 'tag-outline',
      func: async () => {
        if (!premiumUser) {
          close('premium');
          return;
        }

        if (!note.id) return;
        if (note.type === 'note') {
          await db.notes.note(note.id).pin();
        } else {
          await db.notebooks.notebook(note.id).pin();
        }
        localRefresh(item.type);
      },
      close: false,
      check: true,
      on: note.pinned,
    },
    {
      name: 'Favorite',
      icon: 'star',
      func: async () => {
        if (!premiumUser) {
          close('premium');
          return;
        }
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
    },
    {
      name: 'Add to Vault',
      icon: 'shield',
      func: () => {
        if (!premiumUser) {
          close('premium');
          return;
        }
        if (!note.id) return;

        if (note.locked) {
          close('unlock');
        } else {
          db.vault
            .add(note.id)
            .then(() => {
              sendNoteEditedEvent(note.id, false, true);
              close();
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
      },
      close: true,
      check: true,
      on: note.locked,
    },
  ];


  const _renderColor = (c) => {
    const color = {
      name: c,
      value: COLORS_NOTE[c],
    };

    return (
      <PressableButton
        color={RGB_Linear_Shade(
          !colors.night ? -0.2 : 0.2,
          hexToRGBA(color.value, 1),
        )}
        selectedColor={color.value}
        alpha={!colors.night ? -0.1 : 0.1}
        opacity={1}
        key={color.value}
        onPress={async () => {
          let noteColors = note.colors;

          if (noteColors.includes(color.name)) {
            await db.notes.note(note.id).uncolor(color.name);
          } else {
            await db.notes.note(note.id).color(color.name);
          }
          dispatch({type: Actions.COLORS});
          sendNoteEditedEvent(note.id, false, true);
          localRefresh(note.type, true);
        }}
        customStyle={{
          width: DDS.isTab ? 400 / 10 : w / 10,
          height: DDS.isTab ? 400 / 10 : w / 10,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {note && note.colors && note.colors.includes(color.name) ? (
          <Icon name="check" color="white" size={SIZE.lg} />
        ) : null}
      </PressableButton>
    );
  };

  const _renderRowItem = (rowItem) =>
    rowItems.includes(rowItem.name) ? (
      <TouchableOpacity
        onPress={rowItem.func}
        key={rowItem.name}
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

        <Text
          style={{
            fontFamily: WEIGHT.regular,
            fontSize: DDS.isTab ? SIZE.sm : SIZE.xs + 1,
            color: colors.pri,
          }}>
          {rowItem.name}
        </Text>
      </TouchableOpacity>
    ) : null;

  const _renderColumnItem = (item) =>
    (note.id && columnItems.includes(item.name)) ||
    (item.name === 'Dark Mode' && columnItems.includes(item.name)) ? (
      <TouchableOpacity
        key={item.name}
        activeOpacity={opacity}
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
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
              color: colors.pri,
            }}>
            {item.name}
          </Text>
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
    if (!user) {
      ToastEvent.show(
        'You must login to sync',
        'error',
        'local',
        5000,
        () => {
          close();
          setTimeout(() => {
            eSendEvent(eOpenLoginDialog);
          }, 500);
        },
        'Login',
      );
      return;
    }
    if (user?.lastSynced < note?.dateEdited || !user.lastSynced) {
      setRefreshing(true);
      try {
        await db.sync();
        localRefresh();
        ToastEvent.show('Note synced', 'success', 'local');
      } catch (e) {
        ToastEvent.show(e.message, 'error', 'local');
      } finally {
        let user = await db.user.get();
        dispatch({type: Actions.USER, user: user});
        dispatch({type: Actions.ALL});
        setRefreshing(false);
      }
    } else {
      console.log(
        'here',
        user?.lastSynced,
        user?.lastSynced < note?.dateEdited,
      );
    }
  };

  return (
    <View
      onLayout={() => {
        if (!item.dateDeleted) {
          localRefresh(item.type, true);
        }
      }}
      style={{
        paddingBottom: 30,
        backgroundColor: colors.bg,
        paddingHorizontal: 0,
      }}>
      {!note.id && !note.dateCreated ? (
        <Text
          style={{
            width: '100%',
            textAlign: 'center',
            marginVertical: 10,
            color: colors.icon,
            fontFamily: WEIGHT.regular,
          }}>
          Please start writing to save your note.
        </Text>
      ) : (
        <View
          style={{
            paddingHorizontal: 12,
            alignItems: 'center',
            marginVertical: 10,
          }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.heading,
              fontSize: SIZE.sm + 1,
              fontFamily: WEIGHT.bold,
              maxWidth: '100%',
            }}>
            {note.title.replace('\n', '')}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontSize: SIZE.sm - 1,
              color: colors.pri + 'B3',
              fontFamily: WEIGHT.regular,
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
          </Text>

          <Text
            style={{
              color: colors.icon,
              fontSize: SIZE.xs - 1,
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
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
          </Text>

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
                        borderRadius: 5,
                        backgroundColor: colors.accent,
                        paddingHorizontal: ph / 1.5,
                        paddingVertical: pv / 4,
                        marginRight: 5,
                        marginVertical: 2.5,
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: 'white',
                          fontFamily: WEIGHT.regular,
                          fontSize: SIZE.xxs,
                          maxWidth: '100%',
                        }}>
                        {topic.title}
                      </Text>
                    </View>
                  ))
                : null}
            </View>
          )}

          {note.type !== 'note' || refreshing ? null : (
            <Text
              onPress={onPressSync}
              style={{
                color: colors.accent,
                fontSize: SIZE.xs - 1,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
                marginTop: 5,
                borderWidth: 1,
                textAlign: 'center',
                borderColor: colors.accent,
                paddingHorizontal: 5,
                borderRadius: 2,
              }}>
              {user && user.lastSynced > note.dateEdited
                ? 'Synced'
                : 'Sync Now'}
            </Text>
          )}

          {refreshing ? (
            <ActivityIndicator
              style={{marginTop: 5}}
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

      {hasColors && note.id ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 12,
            width: '100%',
            marginVertical: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {Object.keys(COLORS_NOTE).map(_renderColor)}
        </View>
      ) : null}

          {
            hasTags? <ActionSheetTagsSection note={note} localRefresh={localRefresh} /> : null
          }
     

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
    </View>
  );
};
