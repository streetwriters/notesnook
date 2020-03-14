import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MMKV from 'react-native-mmkv-storage';
import {TextInput} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  opacity,
  pv,
  SIZE,
  WEIGHT,
} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {AnimatedSafeAreaView} from '../../views/Home';
import {w, hexToRGBA, db} from '../../utils/utils';

let tagsInputRef;
let tagsList;
export const EditorMenu = ({updateProps = () => {}, timestamp}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [noteProps, setNoteProps] = useState({
    pinned: false,
    locked: false,
    favorite: false,
    tags: [],
    colors: [],
  });
  const [focused, setFocused] = useState(false);

  let tagToAdd = null;
  let backPressCount = 0;

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(newColors.night ? 'light-content' : 'dark-content');

    dispatch({type: ACTIONS.THEME, colors: newColors});
  }
  useEffect(() => {
    if (timestamp) {
      setNoteProps({...db.getNote(timestamp)});
    }
  }, [timestamp]);

  const _renderListItem = item => (
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
          size={SIZE.sm}
        />
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.sm - 1,
            color: colors.pri,
          }}>
          {item.name}
        </Text>
      </View>
      {item.switch ? (
        <Icon
          size={SIZE.lg}
          color={item.on ? colors.accent : colors.icon}
          name={item.on ? 'toggle-right' : 'toggle-left'}
        />
      ) : (
        undefined
      )}
      {item.check ? (
        <TouchableOpacity
          style={{
            borderWidth: 2,
            borderColor: item.on ? colors.accent : colors.icon,
            width: 22,
            height: 22,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 100,
            paddingTop: 3,
          }}>
          {item.on ? (
            <Icon size={SIZE.sm - 2} color={colors.accent} name="check" />
          ) : null}
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );

  _renderTag = tag => (
    <TouchableOpacity
      key={tag}
      onPress={() => {
        let oldProps = {...noteProps};

        oldProps.tags.splice(oldProps.tags.indexOf(tag), 1);
        db.addNote({
          dateCreated: timestamp,
          content: noteProps.content,
          title: noteProps.title,
          tags: oldProps.tags,
        });
        localRefresh();
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
          {tag.slice(0, 1)}
        </Text>
        {tag.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const localRefresh = () => {
    if (!timestamp) return;

    let toAdd = db.getNote(timestamp);

    setNoteProps({...toAdd});
  };

  _renderColor = item => (
    <TouchableOpacity
      onPress={() => {
        let props = {...noteProps};
        if (props.colors.includes(item)) {
          props.colors.splice(props.colors.indexOf(item), 1);
        } else {
          props.colors.push(item);
        }

        localRefresh();
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        marginBottom: 5,
        borderRadius: 100,
      }}>
      <View
        style={{
          width: (w * 0.3) / 8.5,
          height: (w * 0.3) / 8.5,
          backgroundColor: item,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {noteProps.colors.includes(item) ? (
          <Icon name="check" color="white" size={SIZE.md} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const _onSubmit = () => {
    if (!tagToAdd || tagToAdd === '#') return;

    let tag = tagToAdd;
    if (tag[0] !== '#') {
      tag = '#' + tag;
    }
    if (tag.includes(' ')) {
      tag = tag.replace(' ', '_');
    }
    let oldProps = {...note};

    if (oldProps.tags.includes(tag)) {
      return;
    } else {
      oldProps.tags.push(tag);
    }

    tagsInputRef.setNativeProps({
      text: '#',
    });
    db.addNote({
      dateCreated: timestamp,
      content: noteProps.content,
      title: noteProps.title,
      tags: oldProps.tags,
    });
    localRefresh();
    tagToAdd = '';
    setTimeout(() => {
      //tagsInputRef.focus();
    }, 300);
  };

  const _onKeyPress = event => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && !tagToAdd) {
        backPressCount = 1;

        return;
      }
      if (backPressCount === 1 && !tagToAdd) {
        backPressCount = 0;

        let tagInputValue = note.tags[note.tags.length - 1];
        let oldProps = {...note};
        if (oldProps.tags.length === 1) return;

        oldProps.tags.splice(oldProps.tags.length - 1);

        db.addNote({
          dateCreated: note.dateCreated,
          content: note.content,
          title: note.title,
          tags: oldProps.tags,
        });
        localRefresh();

        tagsInputRef.setNativeProps({
          text: tagInputValue,
        });

        setTimeout(() => {
          tagsInputRef.focus();
        }, 300);
      }
    }
  };

  return (
    <AnimatedSafeAreaView
      transition={['backgroundColor', 'opacity']}
      duration={300}
      style={{
        height: '100%',
        opacity: 1,
        backgroundColor: Platform.ios
          ? hexToRGBA(colors.accent + '19')
          : hexToRGBA(colors.shade),
      }}>
      <KeyboardAvoidingView
        style={{height: '100%', paddingHorizontal: 12, width: '100%'}}
        behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <ScrollView
          contentContainerStyle={{
            minHeight: '80%',
          }}>
          <View>
            <View
              style={{
                height: 0,
                width: '100%',
                marginTop: Platform.OS == 'ios' ? 0 : StatusBar.currentHeight,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                alignSelf: 'center',
                height: 50,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.bold,
                  fontSize: SIZE.md,
                  color: colors.accent,
                }}>
                Properties
              </Text>
            </View>

            <View>
              {[
                {
                  name: 'Dark Mode',
                  icon: 'moon',
                  func: () => {
                    if (!colors.night) {
                      MMKV.setString(
                        'theme',
                        JSON.stringify(COLOR_SCHEME_DARK),
                      );
                      changeColorScheme(COLOR_SCHEME_DARK);
                    } else {
                      MMKV.setString(
                        'theme',
                        JSON.stringify(COLOR_SCHEME_LIGHT),
                      );
                      changeColorScheme(COLOR_SCHEME_LIGHT);
                    }
                  },
                  switch: true,
                  on: colors.night ? true : false,
                  close: false,
                },
                {
                  name: 'Pinned',
                  icon: 'tag',
                  func: () => {
                    if (!timestamp) return;
                    db.pinItem(note.type, note.dateCreated);
                    localRefresh();
                    dispatch({type: ACTIONS.PINNED});
                  },
                  close: false,
                  check: true,
                  on: noteProps.pinned,
                },

                {
                  name: 'Add to Favorites',
                  icon: 'star',
                  func: () => {
                    if (!timestamp) return;

                    db.favoriteItem(note.type, note.dateCreated);
                    localRefresh(item.type);
                    dispatch({type: ACTIONS.FAVORITES});
                  },
                  close: false,
                  check: true,
                  on: noteProps.favorite,
                },
                {
                  name: 'Share ',
                  icon: 'share',
                  func: () => {},
                  close: true,
                },
                {
                  name: 'Move to Notebook',
                  icon: 'arrow-right',
                  func: () => {},
                  close: true,
                },
                {
                  name: 'Export',
                  icon: 'external-link',
                  func: () => {},
                  close: true,
                },

                {
                  name: 'Delete Note',
                  icon: 'trash',
                  func: () => {},
                  close: true,
                },
                {
                  name: noteProps.locked ? 'Remove from Vault' : 'Add to Vault',
                  icon: 'lock',
                  func: () => {
                    if (noteProps.locked) {
                      //setUnlock(true);
                    } else {
                      // setUnlock(false);
                    }
                  },
                  close: true,
                  check: true,
                  on: noteProps.locked,
                },
              ].map(_renderListItem)}
            </View>

            <TouchableOpacity
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 15,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}>
                <Icon
                  style={{
                    width: 30,
                  }}
                  name="tag"
                  color={colors.pri}
                  size={SIZE.md}
                />
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                    color: colors.pri,
                  }}>
                  Add Tags
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 0,
                marginTop: 10,
                borderRadius: 5,
                borderWidth: 1.5,
                borderColor: focused ? colors.accent : colors.nav,
                paddingVertical: 5,
                backgroundColor: colors.nav,
              }}>
              {noteProps && noteProps.tags
                ? noteProps.tags.map(_renderTag)
                : null}
              <TextInput
                style={{
                  backgroundColor: 'transparent',
                  minWidth: 100,
                  fontFamily: WEIGHT.regular,
                  color: colors.pri,
                  paddingHorizontal: 5,
                  paddingVertical: 1.5,
                  margin: 1,
                }}
                blurOnSubmit={false}
                ref={ref => (tagsInputRef = ref)}
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

            <TouchableOpacity
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 15,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}>
                <Icon
                  style={{
                    width: 30,
                  }}
                  name="tag"
                  color={colors.pri}
                  size={SIZE.md}
                />
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                    color: colors.pri,
                  }}>
                  Assign Colors
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 15,
                marginTop: 10,
                width: '100%',
                justifyContent: 'space-between',
              }}>
              {[
                'red',
                'yellow',
                'green',
                'blue',
                'purple',
                'orange',
                'gray',
              ].map(_renderColor)}
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: '5%',
            paddingVertical: pv + 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: colors.icon,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
            }}>
            Last Synced: 5 secs ago.
          </Text>
          {}
          <ActivityIndicator color={colors.accent} />
        </View>
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};
