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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {DDS, db} from '../../../App';
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
import {timeSince, getElevation, hexToRGBA} from '../../utils/utils';

export const Menu = ({
  close = () => {},
  hide,
  update = () => {},
  noTextMode = false,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, colorNotes, user} = state;

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
      icon: 'home-variant-outline',
      func: () => NavigationService.navigate('Home'),
      close: true,
    },

    {
      name: 'Notebooks',
      icon: 'book-outline',
      func: () =>
        NavigationService.navigate('Folders', {
          title: 'Notebooks',
          canGoBack: false,
        }),
      close: true,
    },

    {
      name: 'Favorites',
      icon: 'star-outline',
      func: () => NavigationService.navigate('Favorites'),
      close: true,
    },

    {
      name: 'Trash',
      icon: 'delete-outline',
      func: () => NavigationService.navigate('Trash'),
      close: true,
    },
  ];

  const listItems2 = [
    {
      name: 'Night mode',
      icon: 'theme-light-dark',
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
      icon: 'settings-outline',
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
                    minWidth: noTextMode ? 5 : 35,

                    textAlignVertical: 'center',
                    textAlign: 'left',
                  }}
                  name={item.icon}
                  color={colors.accent}
                  size={SIZE.md + 1}
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
                minWidth: noTextMode ? 5 : 35,
              }}
              name="tag-outline"
              color={colors.accent}
              size={SIZE.md + 1}
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

                paddingTop: noTextMode ? pv + 2 : normalize(15),
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  style={{
                    minWidth: noTextMode ? 5 : 35,
                  }}
                  name={item.icon}
                  color={colors.accent}
                  size={SIZE.md + 1}
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
                  size={SIZE.xl}
                  color={item.on ? colors.accent : colors.icon}
                  name={item.on ? 'toggle-switch' : 'toggle-switch-off'}
                />
              ) : (
                undefined
              )}
            </TouchableOpacity>
          ))}
        </View>

        {user && user.username ? (
          <View
            style={{
              width: '100%',
              borderRadius: 5,
              backgroundColor: Platform.ios
                ? hexToRGBA(colors.accent + '19')
                : hexToRGBA(colors.shade),
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
                onPress={async () => {
                  //await db.sync();
                  console.log(await db.sync(), 'SYNCED');
                  dispatch({type: ACTIONS.NOTES});
                  dispatch({type: ACTIONS.PINNED});
                }}
                style={{
                  fontFamily: WEIGHT.regular,
                  color: 'white',
                  fontSize: SIZE.xs,
                }}>
                <Icon name="account-outline" /> {user.username}
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
                <Icon color={colors.accent} name="sync" /> Synced{' '}
                {user.lastSynced && user.lastSynced !== 0
                  ? timeSince(user.lastSynced)
                  : 'never'}
              </Text>

              <Icon
                size={SIZE.sm}
                color={colors.accent}
                name="check-circle-outline"
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              close();

              DDS.isTab
                ? eSendEvent(eOpenLoginDialog)
                : NavigationService.navigate('Login');
            }}
            activeOpacity={opacity / 2}
            style={{
              ...getElevation(2),
              paddingVertical: pv + 5,
              width: '100%',
              justifyContent: noTextMode ? 'center' : 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
              backgroundColor: colors.accent,
              borderRadius: 5,
              paddingHorizontal: 6,
            }}>
            <Icon
              style={{
                minWidth: 35,
                textAlign: 'left',
              }}
              name="login"
              color="white"
              size={SIZE.lg}
            />

            {noTextMode ? null : (
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  color: 'white',
                  fontSize: SIZE.md,
                }}>
                Login
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};
