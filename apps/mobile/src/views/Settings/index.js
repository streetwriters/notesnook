import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Clipboard, Linking, Modal, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import MMKV from 'react-native-mmkv-storage';
import QRCode from 'react-native-qrcode-generator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ACCENT, COLOR_SCHEME, COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT, opacity, ph, pv, setColorScheme, SIZE, WEIGHT } from '../../common/common';
import { Toast } from '../../components/Toast';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import { eSendEvent } from '../../services/eventManager';
import { eOpenLoginDialog, eResetApp } from '../../services/events';
import NavigationService from '../../services/NavigationService';
import { db, DDS, setSetting, ToastEvent, w } from '../../utils/utils';

export const Settings = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, user, settings} = state;
  const [key, setKey] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused();
  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');

    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  function changeAccentColor(accentColor) {
    ACCENT.color = accentColor;
    ACCENT.shade = accentColor + '12';
    changeColorScheme();
  }

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          visible: false,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: null,
          menu: true,
          canGoBack: false,
          route: route,
          color: null,
          navigation: navigation,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });

      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Settings',
        },
      });

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'settings',
      });

      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          noSearch: true,
        },
      });
    }
  }, [isFocused]);

  return (
    <Animatable.View
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <View
        style={{
          marginTop: Platform.OS == 'ios' ? 125 - 60 : 125 - 60,
        }}
      />

      <Modal
        animated={true}
        animationType="fade"
        visible={modalVisible}
        transparent={true}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}>
          <View
            style={{
              width: '100%',
              backgroundColor: colors.bg,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.xl,
                color: colors.pri,
                marginBottom: 25,
              }}>
              Data Recovery Key
            </Text>

            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
                maxWidth: '85%',
                textAlign: 'center',
                color: colors.pri,
              }}>
              <Text
                style={{
                  color: colors.errorText,
                }}>
                If you lose your password, you can recover your data only using
                your recovery key.{' '}
              </Text>
            </Text>

            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
                maxWidth: '85%',
                textAlign: 'center',
                marginTop: 25,
                marginBottom: 10,
                color: colors.pri,
              }}>
              Take a Sceenshot of QR-Code
            </Text>

            <QRCode value={key} size={200} bgColor="black" fgColor="white" />

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                Clipboard.setString(key);
                ToastEvent.show('Recovery key copied!', 'success', 'local');
              }}
              style={{
                flexDirection: 'row',
                borderWidth: 1,
                borderRadius: 5,
                paddingVertical: 8,
                paddingHorizontal: 10,
                marginTop: 15,
                alignItems: 'center',
                borderColor: colors.nav,
              }}>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                  width: '85%',
                  maxWidth: '85%',
                  paddingRight: 10,
                  color: colors.icon,
                }}>
                {key}
              </Text>
              <Icon color={colors.accent} size={SIZE.lg} name="clipboard" />
            </TouchableOpacity>

            <Text
              style={{
                color: colors.icon,
                fontSize: 10,
                width: '85%',
                maxWidth: '85%',
              }}>
              You can also save your recovery key from app settings on any
              device.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
              }}
              activeOpacity={opacity}
              style={{
                paddingVertical: pv + 5,
                paddingHorizontal: ph,
                borderRadius: 5,
                width: '90%',
                marginTop: 20,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.accent,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  color: 'white',
                  fontSize: SIZE.sm,
                }}>
                I have saved the key
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Toast context="local" />
      </Modal>

      <ScrollView
        style={{
          paddingHorizontal: 12,
        }}>
        {user ? (
          <>
            <Text
              style={{
                fontSize: SIZE.xs,
                fontFamily: WEIGHT.bold,
                textAlignVertical: 'center',
                color: colors.accent,
                borderBottomColor: colors.nav,
                borderBottomWidth: 0.5,
                paddingBottom: 3,
              }}>
              Account Settings
            </Text>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
                marginTop: pv + 5,
              }}>
              Logged in as:
            </Text>

            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                alignSelf: 'center',
                flexDirection: 'row',
                width: '100%',
                paddingVertical: pv,
                marginBottom: pv + 5,
                marginTop: pv,
                backgroundColor: colors.accent,
                borderRadius: 5,
                padding: 5,
                paddingHorizontal: 12,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon size={SIZE.lg} color="white" name="account-outline" />

                <Text
                  style={{
                    color: 'white',
                    marginLeft: 5,
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                  }}>
                  {user.username}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 5,
                  padding: 5,
                  paddingVertical: 2.5,
                  backgroundColor: 'white',
                }}>
                <Text
                  style={{
                    color: colors.accent,
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.xs,
                  }}>
                  Pro
                </Text>
              </View>
            </View>

            {[
              {
                name: 'Backup my notes',
                func: () => {},
              },
              {
                name: 'Data recovery key',
                func: async () => {
                  let k = await db.user.key();
                  setKey(k.key);
                  setModalVisible(true);
                },
              },
              {
                name: 'Subscription status',
                func: () => {},
              },

              {
                name: 'Logout',
                func: async () => {
                  await db.user.logout();
                  dispatch({type: ACTIONS.USER, user: null});
                  dispatch({type: ACTIONS.CLEAR_ALL});
                  ToastEvent.show('Logged out, syncing disabled', 'success');
                },
              },
            ].map(item => (
              <TouchableOpacity
                key={item.name}
                activeOpacity={opacity}
                onPress={item.func}
                style={{
                  width: '100%',

                  paddingVertical: pv + 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: SIZE.sm,
                    fontFamily: WEIGHT.regular,
                    textAlignVertical: 'center',
                    color: colors.pri,
                  }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => {
                DDS.isTab
                  ? eSendEvent(eOpenLoginDialog)
                  : NavigationService.navigate('Login', {
                      root: true,
                    });
              }}
              activeOpacity={opacity / 2}
              style={{
                paddingVertical: pv + 5,
                marginBottom: pv + 5,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.shade,
                borderRadius: 5,
                paddingHorizontal: 6,
              }}>
              <View
                style={{
                  width: 40,
                  backgroundColor: colors.accent,
                  height: 40,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon size={SIZE.lg} color="white" name="account-outline" />
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
                  }}>
                  Login to sync notes.
                </Text>
              </View>

              <View
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  right: 6,
                }}>
                <Icon
                  name="chevron-right"
                  color={colors.accent}
                  size={SIZE.lg}
                />
              </View>
            </TouchableOpacity>
          </>
        )}
        <Text
          style={{
            fontSize: SIZE.xs,
            fontFamily: WEIGHT.bold,
            textAlignVertical: 'center',
            color: colors.accent,

            borderBottomColor: colors.nav,
            borderBottomWidth: 0.5,
            paddingBottom: 3,
          }}>
          Appearance
        </Text>

        <Text
          style={{
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            textAlignVertical: 'center',
            color: colors.pri,
            marginTop: pv + 5,
          }}>
          Accent Color
        </Text>

        <View
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
          style={{
            borderRadius: 5,
            padding: 5,
            marginTop: 10,
            marginBottom: pv + 5,
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
          {[
            '#e6194b',
            '#3cb44b',
            '#ffe119',
            '#0560FF',
            '#f58231',
            '#911eb4',
            '#46f0f0',
            '#f032e6',
            '#bcf60c',
            '#fabebe',
          ].map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                changeAccentColor(item);

                MMKV.setStringAsync('accentColor', item);
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 5,
                marginVertical: 5,
              }}>
              <View
                style={{
                  width: w / 5 - 35,
                  height: w / 5 - 35,
                  backgroundColor: item,
                  borderRadius: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {colors.accent === item ? (
                  <Icon size={SIZE.lg} color="white" name="check" />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!colors.night) {
              MMKV.setStringAsync('theme', JSON.stringify({night: true}));
              changeColorScheme(COLOR_SCHEME_DARK);
            } else {
              MMKV.setStringAsync('theme', JSON.stringify({night: false}));

              changeColorScheme(COLOR_SCHEME_LIGHT);
            }
          }}
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Dark mode
          </Text>
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-switch' : 'toggle-switch-off'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            let scale = settings.fontScale;

            scale === 1
              ? (scale = 1.1)
              : scale === 1.1
              ? (scale = 1.2)
              : scale === 1.2
              ? (scale = 1.3)
              : scale === 1.3
              ? (scale = 1.4)
              : scale === 1.4
              ? (scale = 1.5)
              : scale === 1.5
              ? (scale = 0.8)
              : scale === 0.8
              ? (scale = 0.9)
              : (scale = 0.9 ? (scale = 1) : (scale = 1));

            await setSetting(settings, 'fontScale', scale);

            eSendEvent(eResetApp);
          }}
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Font Scaling
          </Text>

          <View
            style={{
              borderBottomWidth: 1,
              borderColor: colors.nav,
              paddingVertical: 1,
              paddingHorizontal: 5,
            }}>
            <Text
              style={{
                fontSize: SIZE.xs,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              {settings?.fontScale ? settings.fontScale + 'X' : '1X'}
            </Text>
          </View>
        </TouchableOpacity>

        {DDS.isTab ? (
          <TouchableOpacity
            onPress={async () => {
              await setSetting(
                settings,
                'forcePortraitOnTablet',
                !settings.forcePortraitOnTablet,
              );
            }}
            activeOpacity={opacity}
            style={{
              width: '100%',
              marginHorizontal: 0,
              paddingVertical: pv + 5,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              Force portrait mode
            </Text>
            <Icon
              size={SIZE.xl}
              color={
                settings.forcePortraitOnTablet ? colors.accent : colors.icon
              }
              name={
                settings.forcePortraitOnTablet
                  ? 'toggle-switch'
                  : 'toggle-switch-off'
              }
            />
          </TouchableOpacity>
        ) : null}

        <Text
          style={{
            fontSize: SIZE.xs,
            fontFamily: WEIGHT.bold,
            textAlignVertical: 'center',
            color: colors.accent,

            borderBottomColor: colors.nav,
            borderBottomWidth: 0.5,
            paddingBottom: 3,
            marginBottom: pv + 5,
          }}>
          Other
        </Text>

        {[
          {
            name: 'Privacy Policy',
            func: () => {
              Linking.openURL('https://www.notesnook.com/privacy.html');
            },
          },
          {
            name: 'About',
            func: () => {
              Linking.openURL('https://www.notesnook.com');
            },
          },
        ].map(item => (
          <TouchableOpacity
            key={item.name}
            activeOpacity={opacity}
            onPress={item.func}
            style={{
              width: item.step ? '85%' : w - 24,
              paddingVertical: pv + 5,
            }}>
            <Text
              style={{
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              {item.name}
            </Text>
            {item.customComponent ? item.customComponent : null}
          </TouchableOpacity>
        ))}
        <View
          style={{
            height: 300,
          }}
        />
      </ScrollView>
    </Animatable.View>
  );
};

export default Settings;
