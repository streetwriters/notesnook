import React, {useEffect, useState, createRef, useRef} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  FlatList,
  DeviceEventEmitter,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
  COLOR_SCHEME_DARK,
  setColorScheme,
  COLOR_SCHEME_LIGHT,
  clearThemeUpdateListener,
  onThemeUpdate,
} from '../../common/common';

import Icon from 'react-native-vector-icons/Feather';

import {getElevation, w, h, Toast} from '../../utils/utils';
import AsyncStorage from '@react-native-community/async-storage';
import {useForceUpdate} from '../../views/ListsEditor';
import {AnimatedSafeAreaView} from '../../views/Home';
import {TextInput} from 'react-native-gesture-handler';
import {useAppContext} from '../../provider/useAppContext';

let tagsInputRef;

export const EditorMenu = ({
  close = () => {},
  hide,
  update = () => {},
  updateProps = () => {},
  noteProps,
}) => {
  const {colors, changeColorScheme} = useAppContext();

  let tagToAdd = null;
  let backPressCount = 0;

  return (
    <AnimatedSafeAreaView
      transition={['backgroundColor', 'opacity']}
      duration={300}
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        backgroundColor: colors.night ? colors.navbg : colors.navbg,
      }}>
      <KeyboardAvoidingView
        style={{height: '100%'}}
        behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <ScrollView
          contentContainerStyle={{
            justifyContent: 'space-between',
            height: '100%',
          }}>
          <View>
            <View
              style={{
                height: 2,
                width: '100%',
                marginBottom: 5,
                marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.03,
              }}
            />
            <FlatList
              data={[
                {
                  name: 'Dark Mode',
                  icon: 'moon',
                  func: () => {
                    if (!colors.night) {
                      AsyncStorage.setItem(
                        'theme',
                        JSON.stringify(COLOR_SCHEME_DARK),
                      );
                      changeColorScheme(COLOR_SCHEME_DARK);
                    } else {
                      AsyncStorage.setItem(
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
                  name: 'Delete',
                  icon: 'trash',
                  func: () => {},
                  close: true,
                },
                {
                  name: 'Locked',
                  icon: 'lock',
                  func: () => {},
                  close: true,
                  check: true,
                  on: false,
                },
              ]}
              keyExtractor={(item, index) => item.name}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={() => {
                    item.close === false ? null : close();
                    item.func();
                  }}
                  style={{
                    width: '100%',
                    alignSelf: 'center',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingHorizontal: '5%',
                    paddingVertical: pv + 5,
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
                      color={colors.icon}
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
                        <Icon
                          size={SIZE.sm - 2}
                          color={colors.accent}
                          name="check"
                        />
                      ) : null}
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingHorizontal: '5%',
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
                  color={colors.icon}
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
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: '5%',
                marginBottom: 0,
                marginTop: 10,
                borderRadius: 5,
                backgroundColor: colors.nav,
              }}>
              {noteProps.tags.map(item => (
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
              ))}
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
                placeholder="#hashtag"
                onChangeText={value => {
                  tagToAdd = value;
                  if (tagToAdd.length > 0) backPressCount = 0;
                }}
                onKeyPress={event => {
                  if (event.nativeEvent.key === 'Backspace') {
                    if (backPressCount === 0 && !tagToAdd) {
                      backPressCount = 1;

                      return;
                    }
                    if (backPressCount === 1 && !tagToAdd) {
                      backPressCount = 0;

                      let tagInputValue =
                        noteProps.tags[noteProps.tags.length - 1];
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
                }}
                onSubmitEditing={() => {
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
                }}
              />
            </ScrollView>

            <TouchableOpacity
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingHorizontal: '5%',
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
                  color={colors.icon}
                  size={SIZE.md}
                />
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                    color: colors.pri,
                  }}>
                  Add to Color
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
              ].map(item => (
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
                      : colors.navbg,
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
              ))}
            </ScrollView>
          </View>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};
