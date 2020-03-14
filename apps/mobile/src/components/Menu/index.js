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
import MMKV from 'react-native-mmkv-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
import {timeSince, getElevation, hexToRGBA, db, DDS} from '../../utils/utils';
import {inputRef} from '../SearchInput';

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
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');

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
          MMKV.setString('theme', JSON.stringify({night: true}));
          changeColorScheme(COLOR_SCHEME_DARK);
        } else {
          MMKV.setString('theme', JSON.stringify({night: false}));

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
          height: DDS.isTab && noTextMode ? 50 : 0,
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
        {DDS.isTab && noTextMode ? (
          <TouchableOpacity
            onPress={() => {
              eSendEvent(eOpenModalMenu);
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
              name="menu"
              size={SIZE.lg}
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
        contentContainerStyle={{minHeight: '50%'}}
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
                if (item.close) {
                  inputRef.current?.setNativeProps({
                    text: '',
                  });
                  dispatch({
                    type: ACTIONS.SEARCH_RESULTS,
                    results: {
                      type: null,
                      results: [],
                      keyword: null,
                    },
                  });
                }
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
            {tags
              .filter(o => o.count > 1)
              .slice(0, tags.length > 10 ? 10 : tags.length)
              .map(item => (
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
                    paddingHorizontal: 0,
                    marginLeft: 5,
                    marginTop: 5,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.nav,
                  }}>
                  <Text
                    style={{
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.sm - 1,
                      color: colors.accent,
                    }}>
                    #
                  </Text>
                  <Text
                    style={{
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.sm - 1,
                      color: colors.icon,
                    }}>
                    {item.title + ' '}
                  </Text>
                  {item.count > 1 ? (
                    <Text
                      style={{
                        color: 'white',
                        backgroundColor: colors.accent,
                        fontSize: SIZE.xxs,
                        minWidth: 12,
                        minHeight: 12,
                        borderRadius: 2,
                        textAlign: 'center',
                        padding: 0,
                        paddingHorizontal: 1,
                      }}>
                      {item.count > 99 ? '99+' : item.count}
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
                  width: noTextMode ? SIZE.md : normalize(35),
                  height: noTextMode ? SIZE.md : normalize(35),
                  backgroundColor: item.title,
                  borderRadius: 100,
                }}></View>
              <Text
                style={{
                  color: colors.pri,
                  fontSize: SIZE.xxs,
                  minWidth: 12,
                  minHeight: 12,
                  paddingHorizontal: 2,
                  textAlign: 'center',
                  position: 'absolute',
                  bottom: -5,
                  right: item.count < 10 ? -6 : -8,
                }}>
                {item.count > 99 ? '99+' : item.count}
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
              DDS.isTab
                ? eSendEvent(eOpenLoginDialog)
                : NavigationService.navigate('Login');
            }}
            activeOpacity={opacity / 2}
            style={{
              paddingVertical: 12,
              marginVertical: 5,
              marginTop: pv + 5,
              borderRadius: 5,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.shade,

              paddingHorizontal: 12,
            }}>
            <View
              style={{
                width: 30,

                backgroundColor: colors.accent,
                height: 30,
                borderRadius: 100,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon
                style={{
                  textAlign: 'center',
                  textAlignVertical: 'center',
                }}
                name="account-outline"
                color="white"
                size={SIZE.md}
              />
            </View>
            <View
              style={{
                marginLeft: 10,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  color: colors.icon,
                  fontSize: SIZE.xs,
                }}>
                You are not logged in
              </Text>
              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.sm - 2,
                }}>
                Login to sync notes.
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};
