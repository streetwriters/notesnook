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

let tagsInputRef;

export const EditorMenu = ({close = () => {}, hide, update = () => {}}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const forceUpdate = useForceUpdate();
  const [tags, setTags] = useState([]);
  const [selectedColor, setSelectedColor] = useState([]);
  let tagToAdd = null;
  let backPressCount = 0;

  useEffect(() => {
    onThemeUpdate(() => {
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);

  return (
    <AnimatedSafeAreaView
      transition={['backgroundColor', 'opacity']}
      duration={1000}
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        backgroundColor: colors.night ? colors.navbg : colors.navbg,
      }}>
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
                    setColorScheme(COLOR_SCHEME_DARK);
                  } else {
                    AsyncStorage.setItem(
                      'theme',
                      JSON.stringify(COLOR_SCHEME_LIGHT),
                    );
                    setColorScheme(COLOR_SCHEME_LIGHT);
                  }
                },
                switch: true,
                on: colors.night ? true : false,
                close: false,
              },
              {
                name: 'Pinned',
                icon: 'tag',
                func: () => NavigationService.push('Home'),
                close: true,
                check: true,
                on: true,
              },

              {
                name: 'Add to Favorites',
                icon: 'star',
                func: () =>
                  NavigationService.push('Folders', {
                    title: 'Notebooks',
                  }),
                close: true,
                check: true,
                on: false,
              },
              {
                name: 'Share ',
                icon: 'share',
                func: () => NavigationService.push('Lists'),
                close: true,
              },
              {
                name: 'Move to Notebook',
                icon: 'arrow-right',
                func: () => NavigationService.push('Favorites'),
                close: true,
              },

              {
                name: 'Delete',
                icon: 'trash',
                func: () => NavigationService.push('Trash'),
                close: true,
              },
              {
                name: 'Locked',
                icon: 'lock',
                func: () => NavigationService.push('Settings'),
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
                  paddingVertical: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
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
                      fontFamily: WEIGHT.medium,
                      fontSize: SIZE.sm - 1,
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
                alignItems: 'flex-end',
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
                  fontFamily: WEIGHT.medium,
                  fontSize: SIZE.sm - 1,
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
            {tags.map(item => (
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
                    fontFamily: WEIGHT.medium,
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
                color: colors.pri,
                paddingHorizontal: 5,
                paddingVertical: 2.5,
                margin: 5,
              }}
              ref={ref => (tagsInputRef = ref)}
              placeholderTextColor={colors.icon}
              placeholder="Add a tag"
              defaultValue="#"
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

                    let tagInputValue = tags[tags.length - 1];
                    let allTags = tags;
                    if (allTags.length === 1) return;

                    allTags.splice(allTags.length - 1);

                    setTags(allTags);
                    tagsInputRef.setNativeProps({
                      text: tagInputValue,
                    });
                    forceUpdate();
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
                let allTags = [...tags];
                allTags.push(tag);
                tagsInputRef.setNativeProps({
                  text: '#',
                });
                setTags(allTags);
                tagToAdd = '';
                setTimeout(() => {
                  tagsInputRef.focus();
                }, 300);
              }}
            />
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              close();
              NavigationService.navigate('Tags');
            }}
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
                alignItems: 'flex-end',
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
                  fontFamily: WEIGHT.medium,
                  fontSize: SIZE.sm - 1,
                  color: colors.pri,
                }}>
                Add Color
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
            {['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray'].map(
              item => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedColor(item);
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
                    borderColor:
                      selectedColor === item ? colors.pri : colors.navbg,
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
                    {selectedColor === item ? (
                      <Icon name="check" color="white" size={SIZE.md} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>
        <View
          style={{
            paddingHorizontal: '5%',
            borderTopColor: colors.icon,
            borderTopWidth: 1,
            paddingVertical: pv,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: colors.icon,
              fontFamily: WEIGHT.medium,
              fontSize: SIZE.xs + 2,
            }}>
            Last Synced: 5 secs ago.
          </Text>
          {}
          <ActivityIndicator color={colors.accent} />
        </View>
      </ScrollView>
    </AnimatedSafeAreaView>
  );
};
