import React, {createRef, useEffect, useState} from 'react';
import {
  Dimensions,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MMKV from 'react-native-mmkv-storage';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  opacity,
  ph,
  pv,
  setColorScheme,
  SIZE,
  WEIGHT,
} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {timeConverter, ToastEvent, DDS, db} from '../../utils/utils';
import {openVault, eSendEvent} from '../../services/eventManager';
import {refreshNotesPage} from '../../services/events';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const tagsInputRef = createRef();
export const ActionSheetComponent = ({
  close = () => {},
  item,
  hasColors = false,
  hasTags = false,
  rowItems = [],
  columnItems = [],
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, currentEditingNote} = state;
  const [focused, setFocused] = useState(false);
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

    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  useEffect(() => {
    if (item.dateCreated !== null) {
      setNote({...item});
    }
  }, [item]);

  let tagToAdd = null;
  let backPressCount = 0;

  const _onSubmit = async () => {
    if (!tagToAdd || tagToAdd === '' || tagToAdd.trimStart().length == 0) {
      ToastEvent.show('Empty Tag', 'success');
      return;
    }
    let tag = tagToAdd;
    tag = tag.trim();
    if (tag.includes(' ')) {
      tag = tag.replace(' ', '_');
    }
    if (tag.includes(',')) {
      tag = tag.replace(',', '');
    }

    await db.notes.note(note.id).tag(tag);

    setNote({...db.notes.note(note.id).data});
    dispatch({type: ACTIONS.TAGS});
    tagsInputRef.current?.setNativeProps({
      text: '',
    });
    tagToAdd = '';
  };

  const _onKeyPress = async event => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && !tagToAdd) {
        backPressCount = 1;

        return;
      }
      if (backPressCount === 1 && !tagToAdd) {
        backPressCount = 0;

        let tagInputValue = note.tags[note.tags.length - 1];
        let oldProps = {...note};
        if (oldProps.tags.length === 0) return;

        await db.notes
          .note(note.id)
          .untag(oldProps.tags[oldProps.tags.length - 1]);

        setNote({...db.notes.note(note.id).data});

        tagsInputRef.current?.setNativeProps({
          text: tagInputValue,
        });
      }
    } else if (event.nativeEvent.key === ' ') {
      _onSubmit();
      tagsInputRef.current?.setNativeProps({
        text: '',
      });
      return;
    } else if (event.nativeEvent.key === ',') {
      _onSubmit();
      tagsInputRef.current?.setNativeProps({
        text: '',
      });
      return;
    }
  };

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
      dispatch({type: ACTIONS.PINNED});
      dispatch({type: ACTIONS.FAVORITES});
    }
    setNote({...toAdd});
  };

  const rowItemsData = [
    {
      name: 'Add to',
      icon: 'book-outline',
      func: () => {
        dispatch({type: ACTIONS.MODAL_NAVIGATOR, enabled: true});
        dispatch({type: ACTIONS.SELECTED_ITEMS, item: note});

        close('movenote');
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
        close();
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
      name: 'Open',
      icon: 'open-in-app',
      func: () => {
        NavigationService.navigate('Editor', {
          note: item,
        });
        close();
      },
    },
    {
      name: 'Restore',
      icon: 'delete-restore',
      func: async () => {
        await db.trash.restore(note.id);
        dispatch({type: ACTIONS.TRASH});
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
    },
    {
      name: 'Pin',
      icon: 'tag-outline',
      func: async () => {
        if (!note.id) return;
        if (note.type === 'note') {
          await db.notes.note(note.id).pin();
        } else {
          await db.notebooks.notebook(note.id).pin();
        }
        dispatch({type: ACTIONS.PINNED});
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
        if (!note.id) return;
        if (note.type === 'note') {
          await db.notes.note(note.id).favorite();
        } else {
          await db.notebooks.notebook(note.id).favorite();
        }
        dispatch({type: ACTIONS.FAVORITES});
        localRefresh(item.type);
      },
      close: false,
      check: true,
      on: note.favorite,
    },
    {
      name: 'Add to Vault',
      icon: 'shield',
      func: () => {
        if (!note.id) return;

        if (note.locked) {
          close('unlock');

          return;
        } else {
          db.vault
            .add(note.id)
            .then(() => {
              dispatch({type: ACTIONS.NOTES});
              eSendEvent(refreshNotesPage);
              dispatch({type: ACTIONS.PINNED});
              close();
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
      close: true,
      check: true,
      on: note.locked,
    },
  ];

  const _renderTag = tag => (
    <TouchableOpacity
      key={tag}
      onPress={async () => {
        let oldProps = {...note};
        try {
          await db.notes
            .note(note.id)
            .untag(oldProps.tags[oldProps.tags.indexOf(tag)]);
          localRefresh(oldProps.type);
          dispatch({type: ACTIONS.TAGS});
        } catch (e) {
          localRefresh(oldProps.type);
        }
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        margin: 1,
        paddingHorizontal: 5,
        paddingVertical: 2.5,
      }}>
      <Text
        style={{
          fontFamily: WEIGHT.regular,
          fontSize: SIZE.sm,
          color: colors.pri,
        }}>
        <Text
          style={{
            color: colors.accent,
          }}>
          #
        </Text>
        {tag}
      </Text>
    </TouchableOpacity>
  );

  const _renderColor = color => (
    <TouchableOpacity
      key={color}
      onPress={async () => {
        let noteColors = note.colors;

        if (noteColors.includes(color)) {
          await db.notes.note(note.id).uncolor(color);
        } else {
          await db.notes.note(note.id).color(color);
        }
        dispatch({type: ACTIONS.COLORS});
        localRefresh(note.type);
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderColor: colors.nav,
      }}>
      <View
        style={{
          width: DDS.isTab ? 400 / 10 : w / 10,
          height: DDS.isTab ? 400 / 10 : w / 10,
          backgroundColor: color,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {note && note.colors && note.colors.includes(color) ? (
          <Icon name="check" color="white" size={SIZE.lg} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const _renderRowItem = rowItem =>
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

  const _renderColumnItem = item =>
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
        {item.switch ? (
          <Icon
            size={SIZE.lg + 2}
            color={item.on ? colors.accent : colors.icon}
            name={item.on ? 'toggle-switch' : 'toggle-switch-off'}
          />
        ) : (
          undefined
        )}
        {item.check ? (
          <Icon
            name={
              item.on ? 'check-circle-outline' : 'checkbox-blank-circle-outline'
            }
            color={item.on ? colors.accent : colors.icon}
            size={SIZE.lg + 2}
          />
        ) : null}
      </TouchableOpacity>
    ) : null;

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
        width: '100%',
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
              color: colors.pri,
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
                ? note.topics.slice(1, 4).map(topic => (
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

          {note.type !== 'note' ? null : (
            <Text
              style={{
                color: colors.accent,
                fontSize: SIZE.xs - 1,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
                marginTop: 2,
                borderWidth: 1,
                textAlign: 'center',
                borderColor: colors.accent,
                paddingHorizontal: 5,
                borderRadius: 2,
              }}>
              Synced
            </Text>
          )}
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
          {['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray'].map(
            _renderColor,
          )}
        </View>
      ) : null}

      {hasTags && (note.id || note.dateCreated) ? (
        <View
          style={{
            marginHorizontal: 12,
          }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: 5,
              marginTop: 5,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs,
                color: colors.accent,
              }}>
              Suggestions:{' '}
            </Text>
            {tags
              .filter(o => o.count > 1 && !note.tags.find(t => t === o.title))
              .map(tag => (
                <TouchableOpacity
                  key={tag.title}
                  onPress={() => {
                    tagToAdd = tag.title;
                    _onSubmit();
                  }}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    margin: 1,
                    marginRight: 5,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 2.5,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.nav,
                  }}>
                  <Text
                    style={{
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.xs,
                      color: colors.pri,
                    }}>
                    <Text
                      style={{
                        color: colors.accent,
                      }}>
                      #
                    </Text>
                    {tag.title}{' '}
                  </Text>
                  <View
                    style={{
                      borderRadius: 2.5,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: SIZE.xxs - 2,
                        minWidth: 12,
                        textAlign: 'center',
                      }}>
                      {tag.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: focused ? colors.accent : colors.nav,
              paddingVertical: 5,
            }}>
            <TouchableOpacity
              onPress={() => {
                tagsInputRef.current?.focus();
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            />
            {note && note.tags ? note.tags.map(_renderTag) : null}
            <TextInput
              style={{
                backgroundColor: 'transparent',
                minWidth: 100,
                zIndex: 10,
                fontFamily: WEIGHT.regular,
                color: colors.pri,
                paddingHorizontal: 5,
                paddingVertical: 1.5,
                margin: 1,
              }}
              blurOnSubmit={false}
              ref={tagsInputRef}
              placeholderTextColor={colors.icon}
              onFocus={() => {
                setFocused(true);
              }}
              selectionColor={colors.accent}
              onBlur={() => {
                setFocused(false);
              }}
              placeholder="#hashtag"
              onChangeText={value => {
                tagToAdd = value;
                if (tagToAdd.length > 0) backPressCount = 0;
              }}
              onSubmitEditing={_onSubmit}
              onKeyPress={_onKeyPress}
            />
          </View>
        </View>
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
    </View>
  );
};
