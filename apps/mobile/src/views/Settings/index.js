import React, {createRef, useCallback, useEffect} from 'react';
import {
  Appearance,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import {enabled} from 'react-native-privacy-snapshot';
import Menu, {MenuItem} from 'react-native-reanimated-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button} from '../../components/Button';
import {PressableButton} from '../../components/PressableButton';
import Seperator from '../../components/Seperator';
import {ListHeaderComponent} from '../../components/SimpleList/ListHeaderComponent';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import Backup from '../../services/Backup';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  ToastEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import PremiumService from '../../services/PremiumService';
import SettingsService from '../../services/SettingsService';
import {
  AndroidModule,
  dWidth,
  MenuItemsList,
  setSetting,
  SUBSCRIPTION_STATUS_STRINGS,
} from '../../utils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme,
} from '../../utils/Colors';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';
import {db} from '../../utils/DB';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenProgressDialog,
  eOpenRecoveryKeyDialog,
  eOpenRestoreDialog,
  eScrollEvent,
  eUpdateSearchState,
} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {opacity, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';

const otherItems = [
  {
    name: 'Privacy Policy',
    func: async () => {
      await Linking.openURL('https://www.notesnook.com/privacy.html');
    },
    desc: 'Read our privacy policy',
  },
  {
    name: 'Check for updates',
    func: async () => {
      await Linking.openURL('https://www.notesnook.com/privacy.html');
    },
    desc: 'Check for a newer version of app',
  },
  {
    name: 'About',
    func: async () => {
      await Linking.openURL('https://www.notesnook.com');
    },
    desc: 'You are using the latest version of our app.',
  },
];

let menuRef = createRef();
export const Settings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Settings', type: 'in'});

    if (DDS.isLargeTablet()) {
      dispatch({
        type: Actions.CONTAINER_BOTTOM_BUTTON,
        state: {
          onPress: null,
        },
      });
    }

    eSendEvent(eUpdateSearchState, {
      placeholder: '',
      data: [],
      noSearch: true,
      type: '',
      color: null,
    });

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'settings',
      {
        menu: true,
      },
      {
        heading: 'Settings',
        id: 'settings_navigation',
      },
    );
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;
      eSendEvent(eScrollEvent, {name: 'Settings', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  return (
    <View
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <ScrollView
        onScroll={(e) =>
          eSendEvent(eScrollEvent, e.nativeEvent.contentOffset.y)
        }
        style={{
          paddingHorizontal: 0,
        }}>
        {!DDS.isLargeTablet() && (
          <ListHeaderComponent type="settings" messageCard={false} />
        )}

        <SettingsUserSection />
        <SettingsAppearanceSection />
        <SettingsPrivacyAndSecurity />
        <SettingsBackupAndRestore />

        <SectionHeader title="Other" />

        {otherItems.map((item) => (
          <CustomButton
            key={item.name}
            title={item.name}
            tagline={item.desc}
            onPress={item.func}
          />
        ))}
        <View
          style={{
            height: 400,
          }}
        />
      </ScrollView>
    </View>
  );
};

export default Settings;

const SectionHeader = ({title}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <Paragraph
      size={SIZE.sm}
      color={colors.accent}
      style={{
        textAlignVertical: 'center',
        paddingHorizontal: 12,
        height: 35,
      }}>
      {title}
    </Paragraph>
  );
};

const CustomButton = ({
  title,
  tagline,
  customComponent,
  onPress,
  maxWidth = '100%',
}) => {
  const [state] = useTracked();
  const {colors} = state;
  return (
    <PressableButton
      color="transparent"
      selectedColor={colors.nav}
      alpha={!colors.night ? -0.02 : 0.02}
      onPress={onPress}
      customStyle={{
        minHeight: 50,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        width: '100%',
        borderRadius: 0,
        flexDirection: 'row',
      }}>
      <Paragraph
        size={SIZE.md}
        style={{
          textAlignVertical: 'center',
          maxWidth: maxWidth,
        }}>
        {title}
        {tagline ? '\n' : null}

        <Paragraph size={SIZE.sm} color={colors.icon}>
          {tagline}
        </Paragraph>
      </Paragraph>
      {customComponent ? customComponent : null}
    </PressableButton>
  );
};

const SettingsUserSection = () => {
  const [state, dispatch] = useTracked();
  const {colors, user} = state;

  const getTimeLeft = (t2) => {
    let d1 = new Date(Date.now());
    let d2 = new Date(t2 * 1000);
    let diff = d2.getTime() - d1.getTime();
    diff = (diff / (1000 * 3600 * 24)).toFixed(0);

    return diff < 0 ? 0 : diff;
  };

  return user ? (
    <>
      <View
        style={{
          paddingHorizontal: 12,
        }}>
        <View
          style={{
            alignSelf: 'center',
            width: '100%',
            borderRadius: 5,
            paddingVertical: 12,
          }}>
          <View
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 100,
                  borderColor: colors.accent,
                  width: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon
                  size={SIZE.md}
                  color={colors.accent}
                  name="account-outline"
                />
              </View>

              <Paragraph
                color={colors.heading}
                style={{
                  marginLeft: 5,
                }}>
                {user.username}
              </Paragraph>
            </View>
            <View
              style={{
                borderRadius: 5,
                padding: 5,
                paddingVertical: 2.5,
                backgroundColor: 'white',
              }}>
              <Heading color={colors.accent} size={SIZE.sm}>
                {SUBSCRIPTION_STATUS_STRINGS[user.subscription.status]}
              </Heading>
            </View>
          </View>
          <Seperator />
          <View>
            {user.subscription.status === 1 ? (
              <Paragraph
                size={SIZE.lg}
                color={
                  getTimeLeft(parseInt(user.subscription.expiry)) > 5
                    ? colors.pri
                    : colors.errorText
                }>
                {getTimeLeft(parseInt(user.subscription.expiry)) +
                  ' Days Remaining'}{' '}
                {'\n'}
                <Paragraph color={colors.icon} size={SIZE.sm}>
                  Your trail period started on{' '}
                  {new Date(
                    user.subscription.start * 1000,
                  ).toLocaleDateString()}
                </Paragraph>
              </Paragraph>
            ) : null}

            <Seperator />

            <Button
              onPress={() => {
                eSendEvent(eOpenPremiumDialog);
              }}
              width="100%"
              fontSize={SIZE.md}
              title="Get Notesnook Pro"
              height={50}
              type="accent"
            />
          </View>
        </View>
      </View>
      {[
        {
          name: 'Save Data Recovery Key',
          func: async () => {
            eSendEvent(eOpenRecoveryKeyDialog);
          },
          desc:
            'If you lose your password, you can recover your data using your recovery key.',
        },
        {
          name: 'Logout',
          func: async () => {
            await db.user.logout();
            dispatch({type: Actions.USER, user: null});
            dispatch({type: Actions.CLEAR_ALL});
            dispatch({type: Actions.SYNCING, syncing: false});
          },
          desc:
            'Logout of your account, this will clear everything and reset the app.',
        },
      ].map((item) => (
        <CustomButton
          key={item.name}
          title={item.name}
          onPress={item.func}
          tagline={item.desc}
        />
      ))}
    </>
  ) : (
    <>
      <View
        style={{
          paddingHorizontal: 0,
        }}>
        <PressableButton
          color="transparent"
          selectedColor={colors.nav}
          alpha={!colors.night ? -0.02 : 0.1}
          onPress={() => {
            eSendEvent(eOpenLoginDialog);
          }}
          activeOpacity={opacity / 2}
          customStyle={{
            paddingVertical: 12,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingHorizontal: 6,
          }}>
          <View
            style={{
              width: 40,
              backgroundColor: colors.accent,
              height: 40,
              marginLeft: 10,
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
            <Paragraph color={colors.icon} size={SIZE.xs}>
              You are not logged in
            </Paragraph>
            <Paragraph color={colors.accent}>Login to sync notes.</Paragraph>
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
            <Icon name="chevron-right" color={colors.accent} size={SIZE.lg} />
          </View>
        </PressableButton>
      </View>
    </>
  );
};

const SettingsAppearanceSection = () => {
  const [state, dispatch] = useTracked();
  const {colors, settings} = state;

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    dispatch({type: Actions.THEME, colors: newColors});
  }

  function changeAccentColor(accentColor) {
    ACCENT.color = accentColor;
    ACCENT.shade = accentColor + '12';
    changeColorScheme();
  }

  const switchTheme = async () => {
    await PremiumService.verify(async () => {
      await SettingsService.set('useSystemTheme', !settings.useSystemTheme);

      if (!settings.useSystemTheme) {
        await MMKV.setStringAsync(
          'theme',
          JSON.stringify({night: Appearance.getColorScheme() === 'dark'}),
        );
        changeColorScheme(
          Appearance.getColorScheme() === 'dark'
            ? COLOR_SCHEME_DARK
            : COLOR_SCHEME_LIGHT,
        );
      }
    });
  };

  return (
    <>
      <SectionHeader title="Appearance" />

      <Paragraph
        size={SIZE.md}
        style={{
          textAlignVertical: 'center',
          paddingHorizontal: 12,
        }}>
        Accent Color{'\n'}
        <Paragraph size={SIZE.sm} color={colors.icon}>
          Change the accent color of the app.
        </Paragraph>
      </Paragraph>

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
          paddingHorizontal: 12,
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
        ].map((item) => (
          <PressableButton
            key={item}
            color={
              colors.accent === item
                ? RGB_Linear_Shade(
                    !colors.night ? -0.2 : 0.2,
                    hexToRGBA(item, 1),
                  )
                : item
            }
            selectedColor={item}
            alpha={!colors.night ? -0.1 : 0.1}
            opacity={1}
            onPress={async () => {
              await PremiumService.verify(async () => {
                changeAccentColor(item);
                await MMKV.setStringAsync('accentColor', item);
              });
            }}
            customStyle={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: 5,
              marginHorizontal: 5,
              width: DDS.isTab ? (dWidth * 0.85 * 0.28) / 5 - 24 : dWidth / 7.5,
              height: DDS.isTab
                ? (dWidth * 0.85 * 0.28) / 5 - 24
                : dWidth / 7.5,
              borderRadius: 100,
            }}>
            {colors.accent === item ? (
              <Icon size={SIZE.lg} color="white" name="check" />
            ) : null}
          </PressableButton>
        ))}
      </View>

      <CustomButton
        title="System Theme"
        tagline="Automatically switch to dark mode when the system theme changes."
        onPress={switchTheme}
        maxWidth="90%"
        customComponent={
          <Icon
            size={SIZE.xl}
            color={settings.useSystemTheme ? colors.accent : colors.icon}
            name={
              settings.useSystemTheme ? 'toggle-switch' : 'toggle-switch-off'
            }
          />
        }
      />

      <CustomButton
        title="Dark Mode"
        tagline="Switch on dark mode at night to protect your eyes."
        onPress={async () => {
          if (!colors.night) {
            await MMKV.setStringAsync('theme', JSON.stringify({night: true}));
            changeColorScheme(COLOR_SCHEME_DARK);
          } else {
            await MMKV.setStringAsync('theme', JSON.stringify({night: false}));

            changeColorScheme(COLOR_SCHEME_LIGHT);
          }
        }}
        maxWidth="90%"
        customComponent={
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-switch' : 'toggle-switch-off'}
          />
        }
      />

      <CustomButton
        title="Homepage"
        tagline={'Default screen to open on app startup '}
        onPress={async () => {
          await PremiumService.verify(menuRef.current?.show);
        }}
        customComponent={
          <Menu
            ref={menuRef}
            animationDuration={200}
            style={{
              borderRadius: 5,
              backgroundColor: colors.bg,
            }}
            button={
              <TouchableOpacity
                onPress={async () => {
                  await PremiumService.verify(menuRef.current?.show);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Paragraph>{settings.homepage}</Paragraph>
                <Icon color={colors.icon} name="menu-down" size={SIZE.md} />
              </TouchableOpacity>
            }>
            {MenuItemsList.slice(0, MenuItemsList.length - 1).map(
              (item, index) => (
                <MenuItem
                  key={item.name}
                  onPress={async () => {
                    await SettingsService.set('homepage', item.name);
                  }}
                  style={{
                    backgroundColor:
                      settings.homepage === item.name
                        ? colors.shade
                        : 'transparent',
                  }}
                  textStyle={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                    color:
                      settings.homepage === item.name
                        ? colors.accent
                        : colors.pri,
                  }}>
                  {item.name}
                </MenuItem>
              ),
            )}
          </Menu>
        }
      />
    </>
  );
};

const SettingsPrivacyAndSecurity = () => {
  const [state] = useTracked();
  const {colors, settings} = state;
  const [vaultStatus, setVaultStatus] = React.useState({
    exists: false,
    biometryEnrolled: false,
    isBiometryAvailable: false,
  });

  const checkVaultStatus = useCallback(() => {
    db.vault.add('check_no_vault').catch(async (e) => {
      let biometry = await Keychain.getSupportedBiometryType();
      let fingerprint = await Keychain.hasInternetCredentials('nn_vault');

      let available = false;
      if (
        biometry === Keychain.BIOMETRY_TYPE.FINGERPRINT ||
        biometry === Keychain.BIOMETRY_TYPE.TOUCH_ID
      ) {
        available = true;
      }
      if (e.message === db.vault.ERRORS.noVault) {
        setVaultStatus({
          exists: false,
          biometryEnrolled: fingerprint,
          isBiometryAvailable: available,
        });
      } else {
        setVaultStatus({
          exists: true,
          biometryEnrolled: fingerprint,
          isBiometryAvailable: available,
        });
      }
    });
  });

  useEffect(() => {
    checkVaultStatus();
    eSubscribeEvent('vaultUpdated', () => checkVaultStatus());
    return () => {
      eUnSubscribeEvent('vaultUpdated', () => checkVaultStatus());
    };
  }, []);

  return (
    <>
      <SectionHeader title="Privacy & Security" />
      <CustomButton
        key="privacyMode"
        title="Privacy Mode"
        tagline="Hide app contents when you switch to other apps. This will also disable screenshot taking in the app."
        onPress={() => {
          Platform.OS === 'android'
            ? AndroidModule.setSecureMode(!settings.privacyScreen)
            : enabled(true);
          setSetting(settings, 'privacyScreen', !settings.privacyScreen);
        }}
        maxWidth="90%"
        customComponent={
          <Icon
            size={SIZE.xl}
            color={settings.privacyScreen ? colors.accent : colors.icon}
            name={
              settings.privacyScreen ? 'toggle-switch' : 'toggle-switch-off'
            }
          />
        }
      />

      {vaultStatus.exists ? (
        <>
          {vaultStatus.isBiometryAvailable ? (
            <CustomButton
              key="fingerprintVaultUnlock"
              title="Unlock vault with Fingerprint"
              tagline="Access vault with fingerprint."
              onPress={() => {
                openVault({
                  item: {},
                  fingerprintAccess: true,
                  novault: true,
                });
              }}
              maxWidth="90%"
              customComponent={
                <Icon
                  size={SIZE.xl}
                  color={
                    vaultStatus.biometryEnrolled ? colors.accent : colors.icon
                  }
                  name={
                    vaultStatus.biometryEnrolled
                      ? 'toggle-switch'
                      : 'toggle-switch-off'
                  }
                />
              }
            />
          ) : null}
          <CustomButton
            key="changeVaultPassword"
            title="Change Vault Password"
            tagline="Setup a new password for the vault"
            onPress={() => {
              openVault({
                item: {},
                changePassword: true,
                novault: true,
              });
            }}
          />
        </>
      ) : (
        <CustomButton
          key="createVault"
          title="Create Vault"
          tagline="Secure your notes by adding the to the vault."
          onPress={() => {
            openVault({
              item: {},
              novault: false,
            });
          }}
        />
      )}
    </>
  );
};

const SettingsBackupAndRestore = () => {
  const [state] = useTracked();
  const {colors, settings, user} = state;

  const backupItemsList = [
    {
      name: 'Backup data',
      func: async () => {
        eSendEvent(eOpenProgressDialog, {
          title: 'Backing up your data',
          paragraph:
            "All your backups are stored in 'Phone Storage/Notesnook/backups/' folder",
        });
        await Backup.run();
        await sleep(1000);
        eSendEvent(eCloseProgressDialog);
      },
      desc: 'Backup all your data to phone storage',
    },
    {
      name: 'Restore backup',
      func: () => {
        eSendEvent(eOpenRestoreDialog);
      },
      desc: 'Restore a backup from your phone.',
    },
  ];

  return (
    <>
      <SectionHeader title="Backup & Restore" />

      {backupItemsList.map((item) => (
        <CustomButton
          key={item.name}
          title={item.name}
          tagline={item.desc}
          onPress={item.func}
        />
      ))}

      <View
        style={{
          width: '100%',
          marginHorizontal: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 50,
          paddingHorizontal: 12,
        }}>
        <Paragraph
          size={SIZE.md}
          style={{
            textAlignVertical: 'center',
            maxWidth: '60%',
          }}>
          Auto Backup{'\n'}
          <Paragraph color={colors.icon} size={SIZE.sm}>
            Backup your data automatically.
          </Paragraph>
        </Paragraph>

        <View
          style={{
            flexDirection: 'row',
            overflow: 'hidden',
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {[
            {
              title: 'Off',
              value: 'off',
            },
            {
              title: 'Daily',
              value: 'daily',
            },
            {
              title: 'Weekly',
              value: 'weekly',
            },
          ].map((item) => (
            <TouchableOpacity
              activeOpacity={1}
              onPress={async () => {
                await PremiumService.verify(async () => {
                  if (Platform.OS === 'android') {
                    let granted = await Storage.requestPermission();
                    if (!granted) {
                      ToastEvent.show(
                        'You must give storage access to enable auto backups.',
                      );
                      return;
                    }
                  }
                  await SettingsService.set('reminder', item.value);
                });
              }}
              key={item.value}
              style={{
                backgroundColor:
                  settings.reminder === item.value ? colors.accent : colors.nav,
                justifyContent: 'center',
                alignItems: 'center',
                width: 50,
                height: 20,
              }}>
              <Paragraph
                color={settings.reminder === item.value ? 'white' : colors.icon}
                size={SIZE.xs}>
                {item.title}
              </Paragraph>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <CustomButton
        title="Backup Encryption"
        tagline="Backups will be encrypted."
        onPress={async () => {
          if (!user) {
            ToastEvent.show(
              'You must login to enable encryption',
              'error',
              'global',
              6000,
              () => {
                eSendEvent(eOpenLoginDialog);
              },
              'Login',
            );
            return;
          }
          await SettingsService.set(
            'encryptedBackup',
            !settings.encryptedBackup,
          );
        }}
        customComponent={
          <Icon
            size={SIZE.xl}
            color={settings.encryptedBackup ? colors.accent : colors.icon}
            name={
              settings.encryptedBackup ? 'toggle-switch' : 'toggle-switch-off'
            }
          />
        }
      />
    </>
  );
};
