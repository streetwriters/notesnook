import React, {useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import {
  SIZE,
  pv,
  opacity,
  WEIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {h} from '../../utils/utils';
import FastStorage from 'react-native-fast-storage';

import {AnimatedSafeAreaView} from '../../views/Home';
import {TextInput} from 'react-native-gesture-handler';
import {useAppContext} from '../../provider/useAppContext';
import {VaultDialog} from '../VaultDialog';
import {useTracked} from '../../provider';

let tagsInputRef;
let tagsList;
export const EditorMenu = ({
  close = () => {},
  hide,
  update = () => {},
  updateProps = () => {},
  noteProps,
  note,
  timestamp,
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  // Todo

  const changeColorScheme = () => {};
  ///////

  const [unlock, setUnlock] = useState(false);
  const [vaultDialog, setVaultDialog] = useState(false);
  const [focused, setFocused] = useState(false);
  let tagToAdd = null;
  let backPressCount = 0;

  _renderListItem = ({item, index}) => (
    <TouchableOpacity
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
        paddingVertical: pv + 5,
        paddingTop: index === 0 ? 5 : pv + 5,
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
            width: 23,
            height: 23,
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

  _renderTag = item => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        margin: 5,
        paddingHorizontal: 5,
        paddingVertical: 2.5,
        backgroundColor: colors.accent,
        borderRadius: 5,
      }}>
      <Text
        style={{
          fontFamily: WEIGHT.regular,
          fontSize: SIZE.sm - 2,
          color: 'white',
        }}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  _renderColor = item => (
    <TouchableOpacity
      onPress={() => {
        let props = {...noteProps};
        if (props.colors.includes(item)) {
          props.colors.splice(props.colors.indexOf(item), 1);
        } else {
          props.colors.push(item);
        }

        updateProps(props);
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginRight: 5,
        marginBottom: 5,
        borderWidth: 1.5,
        borderRadius: 100,
        padding: 3,
        borderColor: noteProps.colors.includes(item)
          ? colors.pri
          : colors.shade,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
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

  _onSubmit = () => {
    if (!tagToAdd || tagToAdd === '#') return;

    let tag = tagToAdd;
    if (tag[0] !== '#') {
      tag = '#' + tag;
    }
    if (tag.includes(' ')) {
      tag = tag.replace(' ', '_');
    }
    let oldProps = {...noteProps};
    oldProps.tags.push(tag);
    tagsInputRef.setNativeProps({
      text: '#',
    });
    updateProps(oldProps);
    tagToAdd = '';
    setTimeout(() => {
      tagsInputRef.focus();
    }, 300);
  };

  _onKeyPress = event => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && !tagToAdd) {
        backPressCount = 1;

        return;
      }
      if (backPressCount === 1 && !tagToAdd) {
        backPressCount = 0;

        let tagInputValue = noteProps.tags[noteProps.tags.length - 1];
        let oldProps = {...noteProps};
        if (allTags.length === 1) return;

        oldProps.tags.splice(allTags.length - 1);

        updateProps(oldProps);
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
        opacity: hide ? 0 : 1,
        backgroundColor: colors.shade,
      }}>
      <KeyboardAvoidingView
        style={{height: '100%'}}
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
                width: '95%',
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

            <FlatList
              data={[
                {
                  name: 'Dark Mode',
                  icon: 'moon',
                  func: () => {
                    if (!colors.night) {
                      FastStorage.setItem(
                        'theme',
                        JSON.stringify(COLOR_SCHEME_DARK),
                      );
                      changeColorScheme(COLOR_SCHEME_DARK);
                    } else {
                      FastStorage.setItem(
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
                    let props = {...noteProps};
                    props.pinned = !noteProps.pinned;

                    updateProps(props);
                  },
                  close: false,
                  check: true,
                  on: noteProps.pinned,
                },

                {
                  name: 'Add to Favorites',
                  icon: 'star',
                  func: () => {
                    let props = {...noteProps};
                    props.favorite = !noteProps.favorite;

                    updateProps(props);
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
                      setUnlock(true);
                    } else {
                      setUnlock(false);
                    }
                    setVaultDialog(true);
                  },
                  close: true,
                  check: true,
                  on: noteProps.locked,
                },
              ]}
              keyExtractor={(item, index) => item.name}
              renderItem={_renderListItem}
            />

            <TouchableOpacity
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingHorizontal: 12,
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

            <ScrollView
              ref={ref => (tagsList = ref)}
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: '5%',
                marginBottom: 0,
                marginTop: 10,
                borderRadius: 5,
                backgroundColor: colors.nav,
                borderWidth: 1.5,
                borderColor: focused ? colors.accent : 'transparent',
              }}>
              {noteProps.tags.map(_renderTag)}
              <TextInput
                style={{
                  backgroundColor: 'transparent',
                  minWidth: 100,
                  fontFamily: WEIGHT.regular,
                  color: colors.pri,
                  paddingHorizontal: 5,
                  paddingVertical: 2.5,
                  margin: 5,
                }}
                ref={ref => (tagsInputRef = ref)}
                placeholderTextColor={colors.icon}
                onFocus={() => {
                  setFocused(true);
                }}
                selectionColor={colors.accent}
                selectTextOnFocus={true}
                onBlur={() => {
                  setFocused(false);
                }}
                placeholder="#hashtag"
                onChangeText={value => {
                  tagToAdd = value;
                  if (tagToAdd.length > 0) backPressCount = 0;
                }}
                onKeyPress={_onKeyPress}
                onSubmitEditing={_onSubmit}
              />
            </ScrollView>

            <TouchableOpacity
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingHorizontal: 12,
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

            <ScrollView
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: '5%',
                marginBottom: 15,
                marginTop: 10,
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
            </ScrollView>
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

        <VaultDialog
          close={(item, locked) => {
            if (item) {
              update(item);
            }
            let props = {...noteProps};
            props.locked = locked;
            updateProps(props);
            setVaultDialog(false);
            setUnlock(false);
          }}
          note={note}
          timestamp={timestamp}
          perm={true}
          openedToUnlock={unlock}
          visible={vaultDialog}
        />
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};
