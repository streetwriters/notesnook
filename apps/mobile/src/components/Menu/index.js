import React, {useEffect} from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastStorage from 'react-native-fast-storage';
import Icon from 'react-native-vector-icons/Feather';
import {DDS} from '../../../App';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  normalize,
  opacity,
  pv,
  setColorScheme,
  SIZE,
  WEIGHT,
  ph,
} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eOpenModalMenu, eSendSideMenuOverlayRef} from '../../services/events';
import NavigationService from '../../services/NavigationService';

export const Menu = ({
  close = () => {},
  hide,
  update = () => {},
  noTextMode = false,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, colorNotes} = state;
  // todo

  let overlayRef;

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(newColors.night ? 'light-content' : 'dark-content');

    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  useEffect(() => {
    dispatch({type: ACTIONS.TAGS});
  }, []);

  const listItems = [
    {
      name: 'Home',
      icon: 'home',
      func: () => NavigationService.navigate('Home'),
      close: true,
    },

    {
      name: 'Notebooks',
      icon: 'book',
      func: () =>
        NavigationService.navigate('Folders', {
          title: 'Notebooks',
          canGoBack: false,
        }),
      close: true,
    },

    {
      name: 'Favorites',
      icon: 'star',
      func: () => NavigationService.navigate('Favorites'),
      close: true,
    },

    {
      name: 'Trash',
      icon: 'trash',
      func: () => NavigationService.navigate('Trash'),
      close: true,
    },
  ];

  const listItems2 = [
    {
      name: 'Night mode',
      icon: 'moon',
      func: () => {
        if (!colors.night) {
          FastStorage.setItem('theme', JSON.stringify({night: true}));
          changeColorScheme(COLOR_SCHEME_DARK);
        } else {
          FastStorage.setItem('theme', JSON.stringify({night: false}));

          changeColorScheme(COLOR_SCHEME_LIGHT);
        }
      },
      switch: true,
      on: colors.night ? true : false,
      close: false,
    },
    {
      name: 'Settings',
      icon: 'settings',
      func: () => NavigationService.navigate('Settings'),
      close: true,
    },
  ];

  return (
    <SafeAreaView
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        width: '100%',
        backgroundColor: 'transparent',
        borderRightWidth: noTextMode ? 1 : 0,
        borderRightColor: noTextMode ? colors.accent : 'transparent',
      }}>
      <View
        style={{
          minHeight: 2,
          width: '100%',
          paddingHorizontal: noTextMode ? 0 : ph,
          height: DDS.isTab ? 50 : 0,
          marginBottom: 0,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: noTextMode ? 'center' : 'space-between',
          marginTop:
            Platform.OS == 'ios'
              ? 0
              : DDS.isTab
              ? noTextMode
                ? StatusBar.currentHeight
                : 0
              : StatusBar.currentHeight,
        }}>
        {noTextMode || !DDS.isTab ? null : (
          <Text
            style={{
              fontSize: SIZE.xxl,
              fontFamily: WEIGHT.bold,
              color: colors.accent,
            }}>
            notesnook
          </Text>
        )}

        {DDS.isTab ? (
          <TouchableOpacity
            onPress={() => {
              noTextMode ? eSendEvent(eOpenModalMenu) : close();
            }}
            style={{
              alignItems: 'center',
              height: 35,
              justifyContent: 'center',
            }}>
            <Icon
              style={{
                marginTop: noTextMode ? 0 : 7.5,
              }}
              name={noTextMode ? 'menu' : 'x'}
              size={noTextMode ? SIZE.lg : SIZE.xxl}
              color={colors.pri}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {DDS.isTab ? null : (
        <View
          ref={ref => (overlayRef = ref)}
          onLayout={() => {
            eSendEvent(eSendSideMenuOverlayRef, {ref: overlayRef});
          }}
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            zIndex: 999,
            backgroundColor: colors.bg,
            display: 'flex',
            transform: [
              {
                translateX: 0,
              },
            ],
          }}
        />
      )}

      <ScrollView
        contentContainerStyle={{minHeight: '80%'}}
        style={{
          paddingHorizontal: noTextMode ? 0 : 12,
        }}
        showsVerticalScrollIndicator={false}>
        <View>
          {listItems.map((item, index) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={opacity / 2}
              onPress={() => {
                item.close === false ? null : close();

                item.func();
              }}
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: noTextMode ? 'center' : 'space-between',
                alignItems: 'center',
                paddingBottom: noTextMode ? pv + 2 : normalize(15),
                paddingTop:
                  index === 0 ? pv : noTextMode ? pv + 2 : normalize(15),
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  style={{
                    minWidth: noTextMode ? 5 : 40,
                  }}
                  name={item.icon}
                  color={colors.accent}
                  size={SIZE.md}
                />
                {noTextMode ? null : (
                  <Text
                    style={{
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.sm,
                      color: colors.pri,
                    }}>
                    {item.name}
                  </Text>
                )}
              </View>

              {item.switch && !noTextMode ? (
                <Icon
                  size={SIZE.lg}
                  color={item.on ? colors.accent : colors.icon}
                  name={item.on ? 'toggle-right' : 'toggle-left'}
                />
              ) : (
                undefined
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={opacity / 2}
          onPress={() => {
            close();
            NavigationService.navigate('Tags');
          }}
          style={{
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: noTextMode ? 'center' : 'space-between',
            alignItems: 'flex-end',
            marginTop: noTextMode ? pv : normalize(15),
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: noTextMode ? 'center' : 'flex-start',
              alignItems: 'center',
            }}>
            <Icon
              style={{
                minWidth: noTextMode ? 5 : 40,
              }}
              name="tag"
              color={colors.accent}
              size={SIZE.md}
            />
            {noTextMode ? null : (
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm - 1,
                  color: colors.pri,
                }}>
                Tags
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {noTextMode ? null : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: 0,
            }}>
            {tags.map(item => (
              <TouchableOpacity
                key={item.title}
                activeOpacity={opacity / 2}
                onPress={() => {
                  close();
                  NavigationService.navigate('Notes', {
                    title: item.title,
                    tag: item,
                    type: 'tag',
                  });
                }}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  padding: 5,
                  paddingLeft: 2.5,
                  marginTop: 5,
                }}>
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.xs + 1,
                    color: colors.accent,
                  }}>
                  #
                </Text>
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.xs + 1,
                    color: colors.icon,
                  }}>
                  {item.title}
                </Text>
                {item.count > 1 ? (
                  <Text
                    style={{
                      color: 'white',
                      backgroundColor: colors.accent,
                      fontSize: SIZE.xxs - 2,
                      minWidth: 10,
                      minHeight: 10,
                      marginTop: -10,
                      borderRadius: 2,
                      textAlign: 'center',
                      padding: 0,
                      paddingHorizontal: 1,
                    }}>
                    {item.count}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View
          style={{
            flexDirection: noTextMode ? 'column' : 'row',
            flexWrap: noTextMode ? 'nowrap' : 'wrap',
            marginTop: pv / 2,
            marginBottom: pv / 2,
          }}>
          {colorNotes.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={opacity / 2}
              onPress={() => {
                NavigationService.navigate('Notes', {
                  type: 'color',
                  title: item.title,
                  color: item,
                });
                close();
              }}
              style={{
                flexDirection: 'row',
                justifyContent: noTextMode ? 'center' : 'flex-start',
                alignItems: 'center',
                margin: noTextMode ? 0 : 5,
                marginLeft: 0,
                marginRight: noTextMode ? 0 : 15,
                marginTop: normalize(15),
              }}>
              <View
                style={{
                  width: noTextMode ? SIZE.md : normalize(30),
                  height: noTextMode ? SIZE.md : normalize(30),
                  backgroundColor: item.title,
                  borderRadius: 100,
                }}></View>
              <Text
                style={{
                  color: colors.pri,
                  fontSize: SIZE.xxs - 2,
                  minWidth: 12,
                  minHeight: 12,
                  borderWidth: 0.5,
                  paddingHorizontal: 2,
                  borderColor: item.title,
                  borderRadius: 100,
                  textAlign: 'center',
                  position: 'absolute',
                  bottom: -5,
                  right:
                    item.count < 10
                      ? -6
                      : item.count >= 10 && item.count < 100
                      ? -9
                      : item.count >= 100 && item.count < 1000
                      ? -11
                      : item.count > 1000
                      ? -14
                      : -8,
                }}>
                {item.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/*  <View
          style={{
            backgroundColor: '#F3A712',
            width: '90%',
            alignSelf: 'center',
            borderRadius: 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 40,
            paddingHorizontal: ph,
            marginVertical: 10,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              color: 'white',
            }}>
            Upgrade to Pro
          </Text>

          <View
            style={{
              ...getElevation(5),
              paddingHorizontal: ph,
              backgroundColor: 'white',
              paddingVertical: pv - 8,
              borderRadius: 5,
            }}>
            <Icon name="star" color="#FCBA04" size={SIZE.lg} />
          </View>
        </View> */}
      </ScrollView>
      <View
        style={{
          width: '100%',
          justifyContent: noTextMode ? 'center' : 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginBottom: 15,
          paddingHorizontal: ph,
        }}>
        {/*  <TouchableOpacity
          onPress={() => {
            close();

            DDS.isTab
              ? eSendEvent(eOpenLoginDialog)
              : NavigationService.navigate('Login');
          }}
          activeOpacity={opacity / 2}
          style={{
            paddingVertical: pv + 5,
            paddingHorizontal: noTextMode ? 0 : 12,
            width: '100%',
            justifyContent: noTextMode ? 'center' : 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          <Icon
            style={{
              minWidth: 40,
            }}
            name="log-in"
            color={colors.accent}
            size={SIZE.lg}
          />

          {noTextMode ? null : (
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                color: colors.accent,
                fontSize: SIZE.md,
              }}>
              {'  '}Login
            </Text>
          )}
        </TouchableOpacity> */}

        <View
          style={{
            width: '100%',
          }}>
          {listItems2.map((item, index) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={opacity / 2}
              onPress={() => {
                item.close === false ? null : close();

                item.func();
              }}
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: noTextMode ? 'center' : 'space-between',
                alignItems: 'center',
                paddingBottom: noTextMode ? pv + 2 : normalize(15),
                paddingTop:
                  index === 0 ? pv : noTextMode ? pv + 2 : normalize(15),
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  style={{
                    minWidth: noTextMode ? 5 : 40,
                  }}
                  name={item.icon}
                  color={colors.accent}
                  size={SIZE.md}
                />
                {noTextMode ? null : (
                  <Text
                    style={{
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.sm - 1,
                      color: colors.pri,
                    }}>
                    {item.name}
                  </Text>
                )}
              </View>

              {item.switch && !noTextMode ? (
                <Icon
                  size={SIZE.lg}
                  color={item.on ? colors.accent : colors.icon}
                  name={item.on ? 'toggle-right' : 'toggle-left'}
                />
              ) : (
                undefined
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={{
            width: '100%',
            borderRadius: 5,
            backgroundColor: colors.shade,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.accent,
              borderRadius: 5,
              paddingHorizontal: 5,
              paddingVertical: 5,
              elevation: 2,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                color: 'white',
                fontSize: SIZE.xs,
              }}>
              <Icon name="user" /> ammarahmed6506
            </Text>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs,
                color: 'white',
              }}>
              Basic
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',

              paddingHorizontal: 5,
              paddingVertical: pv,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                color: colors.pri,
                fontSize: SIZE.xxs,
              }}>
              <Icon color={colors.accent} name="refresh-ccw" /> Synced 3 mins
              ago.
            </Text>

            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: colors.accent,
                width: 16,
                height: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
                paddingTop: 1.5,
              }}>
              <Icon size={SIZE.xxs} color={colors.accent} name="check" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
