import React, {useEffect} from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {createAnimatableComponent} from 'react-native-animatable';
import MMKV from 'react-native-mmkv-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  normalize,
  opacity,
  ph,
  pv,
  setColorScheme,
  SIZE,
  WEIGHT,
} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {
  eClearSearch,
  refreshNotesPage,
  eOpenLoginDialog,
} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {sideMenuRef} from '../../utils/refs';
import {db, DDS, hexToRGBA, ToastEvent} from '../../utils/utils';
import {TimeSince} from './TimeSince';

const AnimatedSafeAreaView = createAnimatableComponent(SafeAreaView);

export const Menu = ({
  close = () => {},
  hide,
  update = () => {},
  noTextMode = false,
  onButtonLongPress = () => {},
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, colorNotes, user, currentScreen, syncing} = state;

  // todo

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
      name: 'Settings',
      icon: 'settings-outline',
      func: () => NavigationService.navigate('Settings'),
      close: true,
    },
  ];

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        width: '100%',
        backgroundColor: colors.bg,
        borderRightWidth: noTextMode ? 1 : 0,
        borderRightColor: noTextMode ? colors.nav : 'transparent',
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
              sideMenuRef.current?.openDrawer();
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

      <ScrollView
        contentContainerStyle={{minHeight: '50%'}}
        showsVerticalScrollIndicator={false}>
        <View>
          {listItems.map((item, index) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={opacity / 2}
              onPress={() => {
                eSendEvent(eClearSearch);
                item.func();
                if (item.close) {
                  close();
                }
              }}
              style={{
                width: '100%',
                backgroundColor:
                  item.name.toLowerCase() === currentScreen
                    ? colors.shade
                    : 'transparent',
                alignSelf: 'center',
                flexDirection: 'row',
                paddingHorizontal: noTextMode ? 0 : 12,
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
            paddingVertical: noTextMode ? pv + 2 : normalize(15),
            backgroundColor:
              currentScreen === 'tags' ? colors.shade : 'transparent',
            paddingHorizontal: noTextMode ? 0 : 12,
            justifyContent: noTextMode ? 'center' : 'space-between',
            alignItems: 'flex-end',
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
              .filter(o => o.noteIds.length > 1)
              .slice(0, tags.length > 10 ? 10 : tags.length)
              .map(item => (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={opacity / 2}
                  onPress={() => {
                    let params = {
                      title: item.title,
                      tag: item,
                      type: 'tag',
                    };
                    NavigationService.navigate('Notes', params);
                    eSendEvent(refreshNotesPage, params);
                    close();
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
                  {item.noteIds.length > 1 ? (
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
                      {item.noteIds.length > 99 ? '99+' : item.noteIds.length}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
          </View>
        )}

        <View
          style={{
            width: '100%',
            paddingHorizontal: 10,
          }}>
          {colorNotes.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={opacity / 2}
              onPress={() => {
                let params = {
                  type: 'color',
                  title: item.title,
                  color: item,
                };
                NavigationService.navigate('Notes', params);
                eSendEvent(refreshNotesPage, params);
                close();
              }}
              style={{
                flexDirection: 'row',
                justifyContent: noTextMode ? 'center' : 'flex-start',
                alignItems: 'center',
                width: '100%',
                paddingVertical: pv,
              }}>
              <View
                style={{
                  width: 35,
                  height: 35,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: SIZE.md,
                    height: SIZE.md,
                    backgroundColor: item.title,
                    borderRadius: 100,
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '85%',
                }}>
                <Text
                  style={{
                    color: colors.pri,
                    fontSize: SIZE.sm - 1,
                  }}>
                  {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
                </Text>

                <Text
                  style={{
                    color: colors.icon,
                    fontSize: SIZE.xs,
                    paddingHorizontal: 5,
                  }}>
                  {item.noteIds.length > 99 ? '99+' : item.noteIds.length}
                </Text>
              </View>
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
                paddingHorizontal: ph,
                backgroundColor:
                  currentScreen === item.name.toLowerCase()
                    ? colors.shade
                    : 'transparent',
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
              width: '93%',
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
                paddingVertical: 8,
                elevation: 2,
              }}>
              <Text
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

            <TouchableOpacity
              onPress={async () => {
                dispatch({
                  type: ACTIONS.SYNCING,
                  syncing: true,
                });
                try {
                  if (!user) {
                    let u = await db.user.get();
                    dispatch({type: ACTIONS.USER, user: u});
                  }
                  await db.sync();
                  ToastEvent.show('Sync Complete', 'success');
                } catch (e) {
                  ToastEvent.show(e.message, 'error');
                }
                let u = await db.user.get();
                dispatch({type: ACTIONS.USER, user: u});
                dispatch({type: ACTIONS.ALL});
                dispatch({
                  type: ACTIONS.SYNCING,
                  syncing: false,
                });
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 5,
                paddingVertical: pv + 5,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {syncing ? (
                  <ActivityIndicator size={SIZE.xs} color={colors.accent} />
                ) : (
                  <Icon color={colors.accent} name="sync" size={SIZE.sm} />
                )}
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    color: colors.pri,
                    fontSize: SIZE.xs,
                    marginLeft: 5,
                  }}>
                  {syncing ? 'Syncing ' : 'Synced '}
                  {!syncing ? (
                    user.lastSynced && user.lastSynced !== 0 ? (
                      <TimeSince time={user.lastSynced} />
                    ) : (
                      'never'
                    )
                  ) : null}
                  {'\n'}
                  <Text
                    style={{
                      fontSize: 8,
                      color: colors.icon,
                    }}>
                    Tap to sync
                  </Text>
                </Text>
              </View>
              <Icon
                size={SIZE.md}
                color={colors.accent}
                name="check-circle-outline"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              DDS.isTab
                ? eSendEvent(eOpenLoginDialog)
                : NavigationService.navigate('Login');
              close();
            }}
            activeOpacity={opacity / 2}
            style={{
              paddingVertical: 12,
              marginVertical: 5,
              marginTop: pv + 5,
              borderRadius: 5,
              width: '93%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: noTextMode ? 'center' : 'flex-start',
              backgroundColor: noTextMode ? 'transparent' : colors.shade,
              paddingHorizontal: noTextMode ? 0 : 12,
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
            {noTextMode ? null : (
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
            )}
          </TouchableOpacity>
        )}
      </View>
    </AnimatedSafeAreaView>
  );
};
