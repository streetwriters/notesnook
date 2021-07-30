import dayjs from 'dayjs';
import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Appearance,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import * as RNIap from 'react-native-iap';
import {enabled} from 'react-native-privacy-snapshot';
import Menu, {MenuItem} from 'react-native-reanimated-material-menu';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import {Button} from '../../components/Button';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import BaseDialog from '../../components/Dialog/base-dialog';
import DialogButtons from '../../components/Dialog/dialog-buttons';
import DialogContainer from '../../components/Dialog/dialog-container';
import DialogHeader from '../../components/Dialog/dialog-header';
import {presentDialog} from '../../components/Dialog/functions';
import {Header as TopHeader} from '../../components/Header/index';
import Input from '../../components/Input';
import {PressableButton} from '../../components/PressableButton';
import Seperator from '../../components/Seperator';
import {Card} from '../../components/SimpleList/card';
import {Toast} from '../../components/Toast';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  useMessageStore,
  useSettingStore,
  useUserStore
} from '../../provider/stores';
import Backup from '../../services/Backup';
import BiometricService from '../../services/BiometricService';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import PremiumService from '../../services/PremiumService';
import SettingsService from '../../services/SettingsService';
import Sync from '../../services/Sync';
import {
  AndroidModule,
  APP_VERSION,
  InteractionManager,
  MenuItemsList,
  preloadImages,
  SUBSCRIPTION_PROVIDER,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_STRINGS
} from '../../utils';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  setColorScheme
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
  eUpdateSearchState
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {pv, SIZE} from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';

let menuRef = createRef();

const format = ver => {
  let parts = ver.toString().split('');
  return `v${parts[0]}.${parts[1]}.${parts[2]}${
    parts[3] === '0' ? '' : parts[3]
  } `;
};

export const Settings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Settings', type: 'in'});
    eSendEvent(eUpdateSearchState, {
      placeholder: '',
      data: [],
      noSearch: true,
      type: '',
      color: null
    });

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'Settings',
      {
        menu: true
      },
      {
        heading: 'Settings',
        id: 'settings_navigation'
      }
    );
  }, []);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setLoading(false);
      navigation.addListener('focus', onFocus);
      db.version()
        .then(ver => {
          console.log(ver, 'VERSION');
          setVersion(ver);
        })
        .catch(e => console.log(e, 'VER'));
    });

    return () => {
      pageIsLoaded = false;
      eSendEvent(eScrollEvent, {name: 'Settings', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  const otherItems = [
    {
      name: 'Terms of service',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com/tos', colors);
        } catch (e) {}
      },
      desc: 'Read our terms of service'
    },

    {
      name: 'Privacy policy',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com/privacy', colors);
        } catch (e) {}
      },
      desc: 'Read our privacy policy'
    },
    {
      name: 'Check for updates',
      func: async () => {
        if (!version) return;
        if (version.mobile <= APP_VERSION) {
          ToastEvent.show({
            heading: 'No new updates',
            type: 'success',
            message: 'You are using the latest version'
          });
          return;
        }
        eSendEvent('updateDialog', version);
      },

      desc:
        version?.mobile > APP_VERSION
          ? 'New update available.'
          : 'You are using the latest version'
    },
    {
      name: `Report an issue`,
      func: async () => {
        try {
          await Linking.openURL('https://github.com/streetwriters/notesnook');
        } catch (e) {}
      },
      desc: `Facing an issue? Report it on our Github`
    },
    {
      name: 'Join our Discord community',

      func: async () => {
        eSendEvent(eOpenProgressDialog, {
          title: 'Join our Discord Community',
          iconColor: 'discord',
          paragraph:
            'We are not ghosts, chat with us and share your experience.',
          valueArray: [
            'Talk with us anytime.',
            'Follow the development process',
            'Give suggestions and report issues.',
            'Get early access to new features',
            'Meet other people using Notesnook'
          ],
          noProgress: true,
          icon: 'discord',
          action: async () => {
            try {
              await openLinkInBrowser('https://discord.gg/zQBK97EE22', colors);
            } catch (e) {}
          },
          actionText: 'Join Now'
        });
      },
      desc: 'We are not ghosts, chat with us and share your experience.'
    },
    {
      name: 'Download on desktop',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com', colors);
        } catch (e) {}
      },
      desc: 'Notesnook app can be downloaded on all platforms'
    },
    {
      name: 'Documentation',
      func: async () => {
        try {
          await openLinkInBrowser('https://docs.notesnook.com', colors);
        } catch (e) {}
      },
      desc: 'Learn about every feature and how it works.'
    },
    {
      name: 'Roadmap',
      func: async () => {
        try {
          await openLinkInBrowser(
            'https://docs.notesnook.com/roadmap/',
            colors
          );
        } catch (e) {}
      },
      desc: 'See what the future of Notesnook is going to be like.'
    },
    {
      name: 'About Notesnook',
      func: async () => {
        try {
          await openLinkInBrowser('https://notesnook.com', colors);
        } catch (e) {}
      },
      desc: format(APP_VERSION)
    }
  ];

  return (
    <>
      <ContainerTopSection>
        <TopHeader title="Settings" isBack={false} screen="Settings" />
      </ContainerTopSection>
      <View
        style={{
          height: '100%',
          backgroundColor: colors.bg
        }}>
        <ScrollView
          onScroll={e =>
            eSendEvent(eScrollEvent, {
              y: e.nativeEvent.contentOffset.y,
              screen: 'Settings'
            })
          }
          scrollEventThrottle={1}
          style={{
            paddingHorizontal: 0
          }}>
          <SettingsUserSection />
          <SettingsAppearanceSection />
          <SettingsPrivacyAndSecurity />
          <SettingsBackupAndRestore />

          <SectionHeader
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            title="Other"
          />

          {!collapsed && (
            <>
              <PressableButton
                onPress={async () => {
                  try {
                    await Linking.openURL(
                      Platform.OS === 'ios'
                        ? 'https://bit.ly/notesnook-ios'
                        : 'https://bit.ly/notesnook-and'
                    );
                  } catch (e) {}
                }}
                type="shade"
                customStyle={{
                  borderWidth: 1,
                  borderRadius: 5,
                  paddingVertical: 10,
                  width: '95%',
                  alignItems: 'flex-start',
                  paddingHorizontal: 12,
                  marginTop: 10,
                  borderColor: colors.accent
                }}>
                <Heading
                  color={colors.accent}
                  style={{
                    fontSize: SIZE.md
                  }}>
                  {`Rate us on ${
                    Platform.OS === 'ios' ? 'Appstore' : 'Playstore'
                  }`}
                </Heading>
                <Paragraph
                  style={{
                    flexWrap: 'wrap',
                    flexBasis: 1
                  }}
                  color={colors.pri}>
                  It took us a year to bring Notesnook to life, the best private
                  note taking app. It will take you a moment to rate it to let
                  us know what you think!
                </Paragraph>
              </PressableButton>

              {otherItems.map(item => (
                <CustomButton
                  key={item.name}
                  title={item.name}
                  tagline={item.desc}
                  onPress={item.func}
                />
              ))}
            </>
          )}

          <AccoutLogoutSection />

          <View
            style={{
              height: 400
            }}
          />
        </ScrollView>
      </View>
    </>
  );
};

export default Settings;

const SectionHeader = ({title, collapsed, setCollapsed}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        setCollapsed(!collapsed);
      }}
      style={{
        height: 50,
        backgroundColor: colors.nav,
        paddingHorizontal: 12,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        width: '95%',
        alignSelf: 'center',
        borderRadius: 5,
        marginBottom: 5,
        marginTop: 5
      }}>
      {collapsed ? (
        <Paragraph
          size={SIZE.md + 1}
          color={collapsed ? colors.icon : colors.accent}>
          {title}
        </Paragraph>
      ) : (
        <Heading size={SIZE.md + 1} color={colors.accent}>
          {title}
        </Heading>
      )}

      <Icon
        name={collapsed ? 'chevron-down' : 'chevron-up'}
        color={collapsed ? colors.icon : colors.accent}
        size={SIZE.lg}
      />
    </TouchableOpacity>
  );
};

let passwordValue = null;
const AccoutLogoutSection = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const user = useUserStore(state => state.user);
  const [visible, setVisible] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    user && (
      <>
        {loading && (
          <BaseDialog visible={true}>
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.bg,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Heading color={colors.pri} size={SIZE.md}>
                Logging out
              </Heading>
              <View
                style={{
                  flexDirection: 'row',
                  height: 10,
                  width: 100,
                  marginTop: 15
                }}>
                <AnimatedProgress fill={colors.accent} total={8} current={8} />
              </View>
            </View>
          </BaseDialog>
        )}

        {visible && (
          <BaseDialog visible={true}>
            <DialogContainer>
              <DialogHeader
                title="Logout"
                paragraph="Clear all your data and reset the app."
              />
              <DialogButtons
                positiveTitle="Logout"
                negativeTitle="Cancel"
                onPressNegative={() => setVisible(false)}
                onPressPositive={async () => {
                  setVisible(false);
                  setLoading(true);
                  await sleep(10);
                  await db.user.logout();
                  await BiometricService.resetCredentials();
                  await Storage.write('introCompleted', 'true');
                  setLoading(false);
                }}
              />
            </DialogContainer>
          </BaseDialog>
        )}

        {deleteAccount && (
          <BaseDialog
            onRequestClose={() => {
              setDeleteAccount(false);
              passwordValue = null;
            }}
            visible={true}>
            <DialogContainer>
              <DialogHeader
                title="Delete account"
                paragraph="Your account will be deleted and all your data will be removed
                permanantly. Make sure you have saved backup of your notes. This action is IRREVERSIBLE."
                paragraphColor={colors.red}
              />

              <Input
                placeholder="Enter account password"
                onChangeText={v => {
                  passwordValue = v;
                }}
                secureTextEntry={true}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-end'
                }}>
                <Button
                  onPress={() => {
                    setDeleteAccount(false);
                    passwordValue = null;
                  }}
                  fontSize={SIZE.md}
                  type="gray"
                  title="Cancel"
                />
                <Button
                  onPress={async () => {
                    if (!passwordValue) {
                      ToastEvent.show({
                        heading: 'Account Password is required',
                        type: 'error',
                        context: 'local'
                      });
                      return;
                    }
                    try {
                      await db.user.deleteUser(passwordValue);
                    } catch (e) {
                      ToastEvent.show({
                        heading: 'Failed to delete account',
                        message: e.message,
                        type: 'error',
                        context: 'local'
                      });
                    }
                    close();
                  }}
                  fontSize={SIZE.md}
                  style={{
                    marginLeft: 10
                  }}
                  type="error"
                  title="Delete"
                />
              </View>
            </DialogContainer>
            <Toast context="local" />
          </BaseDialog>
        )}

        {[
          {
            name: 'Logout',
            func: async () => {
              setVisible(true);
            }
          }
        ].map((item, index) => (
          <PressableButton
            onPress={item.func}
            key={item.name}
            type="gray"
            customStyle={{
              height: 50,
              borderTopWidth: index === 0 ? 1 : 0,
              borderTopColor: colors.nav,
              width: '100%',
              alignItems: 'flex-start',
              paddingHorizontal: 12,
              marginTop: index === 0 ? 25 : 0,
              borderRadius: 0
            }}>
            <Heading
              color={item.name === 'Logout' ? colors.pri : colors.red}
              style={{
                fontSize: SIZE.md
              }}>
              {item.name}
            </Heading>
          </PressableButton>
        ))}

        <PressableButton
          onPress={() => {
            setDeleteAccount(true);
            passwordValue = null;
          }}
          type="error"
          customStyle={{
            borderWidth: 1,
            borderRadius: 5,
            paddingVertical: 10,
            width: '95%',
            alignItems: 'flex-start',
            paddingHorizontal: 12,
            marginTop: 25,
            borderColor: colors.red
          }}>
          <Heading
            color={colors.red}
            style={{
              fontSize: SIZE.md
            }}>
            Delete account
          </Heading>
          <Paragraph
            style={{
              flexWrap: 'wrap',
              flexBasis: 1
            }}
            color={colors.red}>
            Your account will be deleted and all your data will be removed
            permanantly. Make sure you have saved backup of your notes. This
            action is IRREVERSIBLE.
          </Paragraph>
        </PressableButton>
      </>
    )
  );
};

const CustomButton = ({
  title,
  tagline,
  customComponent,
  onPress,
  maxWidth = '100%',
  color = null
}) => {
  const [state] = useTracked();
  const {colors} = state;
  return (
    <PressableButton
      onPress={onPress}
      customStyle={{
        minHeight: 50,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        width: '100%',
        borderRadius: 0,
        flexDirection: 'row'
      }}>
      <View
        style={{
          maxWidth: maxWidth
        }}>
        <Paragraph
          size={SIZE.md}
          color={color || colors.pri}
          style={{
            textAlignVertical: 'center'
          }}>
          {title}
        </Paragraph>
        <Paragraph size={SIZE.sm} color={colors.icon}>
          {tagline}
        </Paragraph>
      </View>
      {customComponent ? customComponent : null}
    </PressableButton>
  );
};

const getTimeLeft = t2 => {
  let daysRemaining = dayjs(t2).diff(dayjs(), 'days');
  return {
    time: dayjs(t2).diff(dayjs(), daysRemaining === 0 ? 'hours' : 'days'),
    isHour: daysRemaining === 0
  };
};

let passwordVerifyValue = null;
const SettingsUserSection = () => {
  const [state] = useTracked();
  const {colors} = state;

  const user = useUserStore(state => state.user);
  const messageBoardState = useMessageStore(state => state.message);
  const [verifyUser, setVerifyUser] = useState(false);
  const subscriptionDaysLeft =
    user && getTimeLeft(parseInt(user.subscription?.expiry));
  const isExpired = user && subscriptionDaysLeft.time < 0;
  const expiryDate = dayjs(user?.subscription?.expiry).format('MMMM D, YYYY');
  const startDate = dayjs(user?.subscription?.start).format('MMMM D, YYYY');
  const input = useRef();

  const tryVerification = async () => {
    if (!passwordVerifyValue) {
      ToastEvent.show({
        heading: 'Account Password is required',
        type: 'error',
        context: 'local'
      });
      return;
    }
    try {
      let verify = await db.user.verifyPassword(passwordVerifyValue);
      if (verify) {
        setVerifyUser(false);
        passwordVerifyValue = null;
        await sleep(300);
        eSendEvent(eOpenRecoveryKeyDialog);
      } else {
        ToastEvent.show({
          heading: 'Incorrect password',
          message: 'Please enter the correct password to save recovery key.',
          type: 'error',
          context: 'local'
        });
      }
    } catch (e) {
      ToastEvent.show({
        heading: 'Incorrect password',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  const manageSubscription = () => {
    if (
      user.subscription.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED &&
      Platform.OS === 'android'
    ) {
      if (user.subscription.provider === 3) {
        ToastEvent.show({
          heading: 'Subscribed on web',
          message: 'Open your web browser to manage your subscription.',
          type: 'success'
        });
        return;
      }
      Linking.openURL(
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions'
      );
    } else {
      eSendEvent(eOpenPremiumDialog);
    }
  };

  return (
    <>
      {messageBoardState && messageBoardState?.visible && (
        <Card color={colors.accent} />
      )}

      {user ? (
        <>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 15,
              marginBottom: 15
            }}>
            <View
              style={{
                alignSelf: 'center',
                width: '100%',
                paddingVertical: 12,
                backgroundColor: colors.bg,
                borderRadius: 5,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.accent
              }}>
              <View
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: 'row',
                  paddingBottom: 2.5
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <View
                    style={{
                      borderWidth: 1,
                      borderRadius: 100,
                      borderColor: colors.accent,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    <Icon
                      size={SIZE.md}
                      color={colors.accent}
                      name="account-outline"
                    />
                  </View>

                  <Paragraph
                    color={colors.heading}
                    size={SIZE.sm}
                    style={{
                      marginLeft: 5
                    }}>
                    {user?.email}
                  </Paragraph>
                </View>
                <View
                  style={{
                    borderRadius: 5,
                    padding: 5,
                    paddingVertical: 2.5
                  }}>
                  <Heading color={colors.accent} size={SIZE.sm}>
                    {SUBSCRIPTION_STATUS_STRINGS[user.subscription.type]}
                  </Heading>
                </View>
              </View>
              <View>
                {user.subscription.type !== SUBSCRIPTION_STATUS.BASIC ? (
                  <View>
                    <Seperator />
                    <Paragraph
                      size={SIZE.lg}
                      color={
                        (subscriptionDaysLeft.time > 5 &&
                          !subscriptionDaysLeft.isHour) ||
                        user.subscription.type !== 6
                          ? colors.accent
                          : colors.red
                      }>
                      {isExpired
                        ? 'Your subscription has ended.'
                        : `${subscriptionDaysLeft.time} ${
                            subscriptionDaysLeft.isHour ? 'hours' : 'days'
                          } remaining`}
                    </Paragraph>
                    <Paragraph color={colors.pri}>
                      {user.subscription.type === 2
                        ? 'You signed up on ' + startDate
                        : user.subscription.type === 1
                        ? 'Your trial period started on ' + startDate
                        : user.subscription.type === 6
                        ? subscriptionDaysLeft.time < -3
                          ? 'Your subscription has ended'
                          : 'Your account will be downgraded to Basic in 3 days'
                        : user.subscription.type === 7
                        ? `Your subscription will end on ${expiryDate}.`
                        : user.subscription.type === 5
                        ? `Your subscription will auto renew on ${expiryDate}.`
                        : null}
                    </Paragraph>
                  </View>
                ) : null}

                {user.isEmailConfirmed &&
                  user.subscription.type !== SUBSCRIPTION_STATUS.PREMIUM &&
                  user.subscription.type !== SUBSCRIPTION_STATUS.BETA && (
                    <>
                      <Seperator />
                      <Button
                        onPress={manageSubscription}
                        width="100%"
                        style={{
                          paddingHorizontal: 0
                        }}
                        fontSize={SIZE.md}
                        title={
                          user.subscription.provider === 3 &&
                          user.subscription.type ===
                            SUBSCRIPTION_STATUS.PREMIUM_CANCELLED
                            ? 'Manage subscription from desktop app'
                            : user.subscription.type ===
                                SUBSCRIPTION_STATUS.PREMIUM_CANCELLED &&
                              Platform.OS === 'android'
                            ? `Resubscribe from Google Playstore`
                            : user.subscription.type ===
                              SUBSCRIPTION_STATUS.PREMIUM_EXPIRED
                            ? `Resubscribe to Notesnook Pro (${
                                PremiumService.getProducts().length > 0
                                  ? PremiumService.getProducts()[0]
                                      .localizedPrice
                                  : '$4.49'
                              } / mo)`
                            : `Subscribe to Notesnook Pro (${
                                PremiumService.getProducts().length > 0
                                  ? PremiumService.getProducts()[0]
                                      .localizedPrice
                                  : '$4.49'
                              } / mo)`
                        }
                        height={50}
                        type="transparent"
                      />
                    </>
                  )}
              </View>

              {user?.subscription?.provider &&
              user.subscription.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
              user.subscription.type !== SUBSCRIPTION_STATUS.BASIC &&
              SUBSCRIPTION_PROVIDER[user?.subscription?.provider] ? (
                <Button
                  title={
                    SUBSCRIPTION_PROVIDER[user?.subscription?.provider]?.title
                  }
                  onPress={() => {
                    eSendEvent(eOpenProgressDialog, {
                      title:
                        SUBSCRIPTION_PROVIDER[user?.subscription?.provider]
                          .title,
                      paragraph:
                        SUBSCRIPTION_PROVIDER[user?.subscription?.provider]
                          .desc,
                      noProgress: true
                    });
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: 10,
                    borderRadius: 3,
                    zIndex: 10
                  }}
                  fontSize={11}
                  textStyle={{
                    fontWeight: 'normal'
                  }}
                  height={20}
                  type="accent"
                />
              ) : null}
            </View>
          </View>

          {verifyUser && (
            <BaseDialog
              onRequestClose={() => {
                setVerifyUser(false);
                passwordVerifyValue = null;
              }}
              onShow={() => {
                setTimeout(() => {
                  input.current?.focus();
                }, 300);
              }}
              statusBarTranslucent={false}
              visible={true}>
              <DialogContainer>
                <DialogHeader
                  title="Verify it's you"
                  paragraph="Enter your account password to save your data recovery key."
                />

                <Input
                  fwdRef={input}
                  placeholder="Enter account password"
                  onChangeText={v => {
                    passwordVerifyValue = v;
                  }}
                  onSubmit={tryVerification}
                  secureTextEntry={true}
                />

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-end'
                  }}>
                  <Button
                    onPress={() => {
                      setVerifyUser(false);
                      passwordVerifyValue = null;
                    }}
                    fontSize={SIZE.md}
                    type="gray"
                    title="Cancel"
                  />
                  <Button
                    onPress={tryVerification}
                    fontSize={SIZE.md}
                    style={{
                      marginLeft: 10
                    }}
                    type="transparent"
                    title="Verify"
                  />
                </View>
              </DialogContainer>
              <Toast context="local" />
            </BaseDialog>
          )}

          {[
            {
              name: 'Save data recovery key',
              func: async () => {
                setVerifyUser(true);
              },
              desc:
                'Recover your data using the recovery key if your password is lost.'
            },
            {
              name: 'Change password',
              func: async () => {
                eSendEvent(eOpenLoginDialog, 3);
              },
              desc: 'Setup a new password for your account.'
            },
            {
              name: 'Having problems with syncing?',
              func: async () => {
                await Sync.run('global', true);
              },
              desc: 'Try force sync to resolve issues with syncing.'
            },
            {
              name: 'Subscription not activated?',
              func: async () => {
                if (Platform.OS === 'android') return;
                eSendEvent(eOpenProgressDialog, {
                  title: 'Loading subscriptions',
                  paragraph: `Please wait while we fetch your subscriptions.`
                });
                let subscriptions = await RNIap.getPurchaseHistory();
                subscriptions.sort(
                  (a, b) => b.transactionDate - a.transactionDate
                );
                let currentSubscription = subscriptions[0];
                eSendEvent(eOpenProgressDialog, {
                  title: 'Notesnook Pro',
                  paragraph: `You subscribed to Notesnook Pro on ${new Date(
                    currentSubscription.transactionDate
                  ).toLocaleString()}. Verify this subscription?`,
                  action: async () => {
                    eSendEvent(eOpenProgressDialog, {
                      title: 'Verifying subscription',
                      paragraph: `Please wait while we verify your subscription.`
                    });
                    await PremiumService.subscriptions.verify(
                      currentSubscription
                    );
                    eSendEvent(eCloseProgressDialog);
                  },
                  icon: 'information-outline',
                  actionText: 'Verify',
                  noProgress: true
                });
              },
              desc: 'Verify your subscription to Notesnook Pro'
            }
          ].map(item =>
            item.name === 'Subscription not activated?' &&
            (Platform.OS !== 'ios' || PremiumService.get()) ? null : (
              <CustomButton
                key={item.name}
                title={item.name}
                onPress={item.func}
                tagline={item.desc}
                color={item.name === 'Logout' ? colors.errorText : colors.pri}
              />
            )
          )}
        </>
      ) : null}
    </>
  );
};

const SettingsAppearanceSection = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const [collapsed, setCollapsed] = useState(true);
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
    if (SettingsService.get().useSystemTheme) {
      await SettingsService.set('useSystemTheme', false);
    } else {
      await PremiumService.verify(async () => {
        await SettingsService.set(
          'useSystemTheme',
          SettingsService.get().useSystemTheme ? false : true
        );
        if (SettingsService.get().useSystemTheme) {
          await MMKV.setStringAsync(
            'theme',
            JSON.stringify({night: Appearance.getColorScheme() === 'dark'})
          );
          changeColorScheme(
            Appearance.getColorScheme() === 'dark'
              ? COLOR_SCHEME_DARK
              : COLOR_SCHEME_LIGHT
          );
        }
      });
    }
  };

  return (
    <>
      <SectionHeader
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        title="Appearance"
      />

      {collapsed ? null : (
        <>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 5
            }}>
            <Paragraph
              size={SIZE.md}
              style={{
                textAlignVertical: 'center'
              }}>
              Accent Color
            </Paragraph>
            <Paragraph size={SIZE.sm} color={colors.icon}>
              Change the accent color of the app.
            </Paragraph>
          </View>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            onMoveShouldSetResponderCapture={() => {
              tabBarRef.current?.setScrollEnabled(false);
            }}
            onMomentumScrollEnd={() => {
              tabBarRef.current?.setScrollEnabled(true);
            }}
            style={{
              borderRadius: 5,
              padding: 5,
              marginTop: 10,
              marginBottom: pv + 5,
              width: '100%',
              paddingHorizontal: 12
            }}
            nestedScrollEnabled
            contentContainerStyle={{
              alignSelf: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap'
            }}>
            {[
              '#FF5722',
              '#FFA000',
              '#1B5E20',
              '#00c853',
              '#757575',
              '#0560ff',
              '#009688',
              '#2196F3',
              '#880E4F',
              '#9C27B0',
              '#9381ff',
              '#FF1744',
              '#B71C1C',
              '#ffadad'
            ].map(item => (
              <PressableButton
                key={item}
                customColor={
                  colors.accent === item
                    ? RGB_Linear_Shade(
                        !colors.night ? -0.2 : 0.2,
                        hexToRGBA(item, 1)
                      )
                    : item
                }
                customSelectedColor={item}
                alpha={!colors.night ? -0.1 : 0.1}
                opacity={1}
                onPress={async () => {
                  await PremiumService.verify(async () => {
                    changeAccentColor(item);
                    preloadImages(item);
                    await MMKV.setStringAsync('accentColor', item);
                  });
                }}
                customStyle={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                  marginVertical: 5,
                  width: DDS.isLargeTablet() ? 40 : 50,
                  height: DDS.isLargeTablet() ? 40 : 50,
                  borderRadius: 100
                }}>
                {colors.accent === item ? (
                  <Icon
                    size={DDS.isLargeTablet() ? SIZE.lg : SIZE.xxl}
                    color="white"
                    name="check"
                  />
                ) : null}
              </PressableButton>
            ))}
            <View style={{width: 50}} />
          </ScrollView>

          <CustomButton
            title="System Theme"
            tagline="Automatically switch to dark mode when the system theme changes."
            onPress={switchTheme}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.useSystemTheme}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={switchTheme}
              />
            }
          />

          <CustomButton
            title="Dark Mode"
            tagline="Switch on dark mode at night to protect your eyes."
            onPress={async () => {
              if (!colors.night) {
                await MMKV.setStringAsync(
                  'theme',
                  JSON.stringify({night: true})
                );
                changeColorScheme(COLOR_SCHEME_DARK);
              } else {
                await MMKV.setStringAsync(
                  'theme',
                  JSON.stringify({night: false})
                );

                changeColorScheme(COLOR_SCHEME_LIGHT);
              }
            }}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={colors.night}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={async isOn => {
                  if (!colors.night) {
                    await MMKV.setStringAsync(
                      'theme',
                      JSON.stringify({night: true})
                    );
                    changeColorScheme(COLOR_SCHEME_DARK);
                  } else {
                    await MMKV.setStringAsync(
                      'theme',
                      JSON.stringify({night: false})
                    );

                    changeColorScheme(COLOR_SCHEME_LIGHT);
                  }
                }}
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
                  backgroundColor: colors.bg
                }}
                button={
                  <TouchableOpacity
                    onPress={async () => {
                      await PremiumService.verify(menuRef.current?.show);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center'
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
                        menuRef.current?.hide();
                        await SettingsService.set('homepage', item.name);
                        ToastEvent.show({
                          heading: 'Homepage set to ' + item.name,
                          message:
                            'Restart the app for changes to take effect.',
                          type: 'success'
                        });
                      }}
                      style={{
                        backgroundColor:
                          settings.homepage === item.name
                            ? colors.shade
                            : 'transparent'
                      }}
                      textStyle={{
                        fontSize: SIZE.md,
                        color:
                          settings.homepage === item.name
                            ? colors.accent
                            : colors.pri
                      }}>
                      {item.name}
                    </MenuItem>
                  )
                )}
              </Menu>
            }
          />
        </>
      )}
    </>
  );
};

const SettingsPrivacyAndSecurity = () => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const [collapsed, setCollapsed] = useState(true);
  const [appLockVisible, setAppLockVisible] = useState(false);

  const [vaultStatus, setVaultStatus] = React.useState({
    exists: false,
    biometryEnrolled: false,
    isBiometryAvailable: false
  });

  const checkVaultStatus = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      db.vault.exists().then(async r => {
        let available = await BiometricService.isBiometryAvailable();
        let fingerprint = await BiometricService.hasInternetCredentials();

        setVaultStatus({
          exists: r,
          biometryEnrolled: fingerprint,
          isBiometryAvailable: available ? true : false
        });
      });
    });
  });

  useEffect(() => {
    checkVaultStatus();
    eSubscribeEvent('vaultUpdated', () => checkVaultStatus());
    return () => {
      eUnSubscribeEvent('vaultUpdated', () => checkVaultStatus());
    };
  }, []);

  const modes = [
    {
      title: 'None',
      value: 'none',
      desc:
        'Disable app lock. Notes will be accessible to anyone who opens the app'
    },
    {
      title: 'Secure Mode',
      value: 'launch',
      desc:
        'Lock app on launch and keep it unlocked when you switch to other apps.'
    },
    {
      title: 'Strict Mode',
      value: 'background',
      desc:
        'Lock app on launch and also when you switch from other apps or background.'
    }
  ];

  const toggleBiometricUnlocking = () => {
    openVault({
      item: {},
      fingerprintAccess: !vaultStatus.biometryEnrolled,
      revokeFingerprintAccess: vaultStatus.biometryEnrolled,
      novault: true,
      title: vaultStatus.biometryEnrolled
        ? 'Revoke biometric unlocking'
        : 'Enable biometery unlock',
      description: vaultStatus.biometryEnrolled
        ? 'Disable biometric unlocking for notes in vault'
        : 'Disable biometric unlocking for notes in vault'
    });
  };

  return (
    <>
      {appLockVisible && (
        <BaseDialog
          onRequestClose={() => {
            setAppLockVisible(false);
          }}
          visible={true}>
          <DialogContainer height={450}>
            <DialogHeader
              title="App lock mode"
              paragraph="Select the level of security you want to enable."
            />
            <Seperator />
            {modes.map(item => (
              <PressableButton
                type={
                  settings.appLockMode === item.value ? 'accent' : 'transparent'
                }
                onPress={() => {
                  SettingsService.set('appLockMode', item.value);
                }}
                customStyle={{
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  paddingHorizontal: 6,
                  paddingVertical: 6,
                  marginTop: 3,
                  marginBottom: 3
                }}
                style={{
                  marginBottom: 10
                }}>
                <Heading
                  color={
                    settings.appLockMode === item.value ? 'white' : colors.pri
                  }
                  style={{maxWidth: '95%'}}
                  size={SIZE.md}>
                  {item.title}
                </Heading>
                <Paragraph
                  color={
                    settings.appLockMode === item.value ? 'white' : colors.icon
                  }
                  style={{maxWidth: '95%'}}
                  size={SIZE.sm}>
                  {item.desc}
                </Paragraph>
              </PressableButton>
            ))}

            <DialogButtons
              negativeTitle="Close"
              onPressNegative={() => {
                setAppLockVisible(false);
              }}
            />
          </DialogContainer>
        </BaseDialog>
      )}

      <SectionHeader
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        title="Privacy & Security"
      />
      {collapsed ? null : (
        <>
          <CustomButton
            key="telemetry"
            title="Enable telemetry"
            tagline="Usage data & crash reports will be sent to us (no 3rd party involved) for analytics. All data is anonymous as mentioned in our privacy policy."
            onPress={() => {
              SettingsService.set('telemetry', !settings.telemetry);
            }}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.telemetry}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={isOn => {
                  SettingsService.set('telemetry', isOn);
                }}
              />
            }
          />

          <CustomButton
            key="privacyMode"
            title="Privacy mode"
            tagline="Hide app contents when you switch to other apps. This will also disable screenshot taking in the app."
            onPress={() => {
              Platform.OS === 'android'
                ? AndroidModule.setSecureMode(!settings.privacyScreen)
                : enabled(true);

              SettingsService.set('privacyScreen', !settings.privacyScreen);
            }}
            maxWidth="90%"
            customComponent={
              <ToggleSwitch
                isOn={settings.privacyScreen}
                onColor={colors.accent}
                offColor={colors.icon}
                size="small"
                animationSpeed={150}
                onToggle={isOn => {
                  Platform.OS === 'android'
                    ? AndroidModule.setSecureMode(isOn)
                    : enabled(true);
                  SettingsService.set('privacyScreen', isOn);
                }}
              />
            }
          />

          {vaultStatus.isBiometryAvailable && (
            <CustomButton
              key="appLock"
              title="App lock"
              tagline="Require biometrics to access your notes."
              onPress={() => {
                setAppLockVisible(true);
              }}
              maxWidth="90%"
            />
          )}

          {vaultStatus.exists ? (
            <>
              {vaultStatus.isBiometryAvailable ? (
                <CustomButton
                  key="fingerprintVaultUnlock"
                  title="Vault biometrics unlock"
                  tagline="Access notes in vault using biometrics"
                  onPress={toggleBiometricUnlocking}
                  maxWidth="90%"
                  customComponent={
                    <ToggleSwitch
                      isOn={vaultStatus.biometryEnrolled}
                      onColor={colors.accent}
                      offColor={colors.icon}
                      size="small"
                      animationSpeed={150}
                      onToggle={toggleBiometricUnlocking}
                    />
                  }
                />
              ) : null}
              <CustomButton
                key="changeVaultPassword"
                title="Change vault password"
                tagline="Setup a new password for the vault"
                onPress={() => {
                  openVault({
                    item: {},
                    changePassword: true,
                    novault: true,
                    title: 'Change vault password',
                    description: 'Set a new password for your vault.'
                  });
                }}
              />
              <CustomButton
                key="clearVault"
                title="Clear vault"
                tagline="Unlock all locked notes and clear vault."
                onPress={() => {
                  openVault({
                    item: {},
                    clearVault: true,
                    novault: true,
                    title: 'Clear vault',
                    description:
                      'Enter vault password to unlock and remove all notes from the vault.'
                  });
                }}
              />

              <CustomButton
                key="deleteVault"
                title="Delete vault"
                tagline="Delete vault (and optionally remove all notes)."
                onPress={() => {
                  openVault({
                    item: {},
                    deleteVault: true,
                    novault: true,
                    title: 'Delete vault',
                    description:
                      'Enter your account password to delete your vault.'
                  });
                }}
              />
            </>
          ) : (
            <CustomButton
              key="createVault"
              title="Create vault"
              tagline="Secure your notes by adding the to the vault."
              onPress={() => {
                PremiumService.verify(() => {
                  openVault({
                    item: {},
                    novault: false,
                    title: 'Create vault',
                    description:
                      'Set a password to create vault and lock notes.'
                  });
                });
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export const SettingsBackupAndRestore = ({isSheet}) => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const user = useUserStore(state => state.user);

  const [collapsed, setCollapsed] = useState(isSheet ? false : true);

  const optItems = isSheet
    ? []
    : [
        {
          name: 'Restore backup',
          func: async () => {
            if (isSheet) {
              eSendEvent(eCloseProgressDialog);
              await sleep(300);
            }
            eSendEvent(eOpenRestoreDialog);
          },
          desc: 'Restore backup from phone storage.'
        },
        {
          name: 'Import notes from other note apps',
          desc: 'Get all your notes in one place with Notesnook Importer.',
          func: async () => {
            if (isSheet) {
              eSendEvent(eCloseProgressDialog);
              await sleep(300);
            }
            eSendEvent(eOpenProgressDialog, {
              title: 'Notesnook Importer',
              icon: 'import',
              noProgress: true,
              action: async () => {
                try {
                  await openLinkInBrowser(
                    'https://importer.notesnook.com',
                    colors
                  );
                } catch (e) {}
              },
              actionText: 'Go to Notesnook Importer',
              learnMore: 'Learn how this works',
              learnMorePress: async () => {
                try {
                  await openLinkInBrowser(
                    'https://docs.notesnook.com/importing/notesnook-importer/',
                    colors
                  );
                } catch (e) {}
              },
              paragraph:
                'Now you can import your notes from all the popular note taking apps. Go to https://importer.notesnook.com to import your notes.'
            });
          },
          new: true
        }
      ];
  const backupItemsList = [
    {
      name: 'Backup now',
      func: async () => {
        if (isSheet) {
          eSendEvent(eCloseProgressDialog);
          await sleep(300);
        }
        if (!user) {
          await Backup.run();
          return;
        }
        presentDialog({
          title: "Verify it's you",
          input: true,
          inputPlaceholder: 'Enter account password',
          paragraph: 'Please enter your account password to backup data',
          positiveText: 'Verify',
          secureTextEntry:true,
          positivePress: async value => {
            try {
              let verified = await db.user.verifyPassword(value);
              if (verified) {
                sleep(300).then(async () => {
                  await Backup.run();
                })
              } else {
                ToastEvent.show({
                  heading: 'Incorrect password',
                  message: 'The account password you entered is incorrect',
                  type: 'error',
                  context: 'local'
                });
                return false;
              }
            } catch (e) {
              ToastEvent.show({
                heading: 'Failed to backup data',
                message: e.message,
                type: 'error',
                context: 'local'
              });
              return false;
            }
          }
        });
      },
      desc: 'Backup your data to phone storage'
    },
    ...optItems
  ];

  const toggleEncryptedBackups = async () => {
    if (!user) {
      ToastEvent.show({
        heading: 'Login required to enable encryption',
        type: 'error',
        func: () => {
          eSendEvent(eOpenLoginDialog);
        },
        actionText: 'Login'
      });
      return;
    }
    await SettingsService.set('encryptedBackup', !settings.encryptedBackup);
  };

  const updateAskForBackup = async () => {
    await MMKV.setItem(
      'askForBackup',
      JSON.stringify({
        timestamp: Date.now() + 86400000 * 3
      })
    );
  };

  return (
    <>
      {!isSheet && (
        <SectionHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title="Backup & restore"
        />
      )}

      {!collapsed && (
        <>
          {backupItemsList.map(item => (
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
              paddingHorizontal: 12
            }}>
            <View
              style={{
                maxWidth: '60%'
              }}>
              <Paragraph
                size={SIZE.md}
                style={{
                  textAlignVertical: 'center',
                  maxWidth: '100%'
                }}>
                Automatic backups
              </Paragraph>
              <Paragraph color={colors.icon} size={SIZE.sm}>
                Backup your data automatically.
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: 'row',
                overflow: 'hidden',
                borderRadius: 5,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              {[
                {
                  title: 'Never',
                  value: 'off'
                },
                {
                  title: 'Daily',
                  value: 'daily'
                },
                {
                  title: 'Weekly',
                  value: 'weekly'
                }
              ].map(item => (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={async () => {
                    if (item.value === 'off') {
                      await SettingsService.set('reminder', item.value);
                    } else {
                      await PremiumService.verify(async () => {
                        if (Platform.OS === 'android') {
                          let granted = await Storage.requestPermission();
                          if (!granted) {
                            ToastEvent.show({
                              heading: 'Could not enable auto backups',
                              message:
                                'You must give storage access to enable auto backups.',
                              type: 'error',
                              context: 'local'
                            });
                            return;
                          }
                        }
                        await SettingsService.set('reminder', item.value);
                        //await Backup.run();
                      });
                    }
                    updateAskForBackup();
                  }}
                  key={item.value}
                  style={{
                    backgroundColor:
                      settings.reminder === item.value
                        ? colors.accent
                        : colors.nav,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 50,
                    height: 20
                  }}>
                  <Paragraph
                    color={
                      settings.reminder === item.value ? 'white' : colors.icon
                    }
                    size={SIZE.xs}>
                    {item.title}
                  </Paragraph>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!isSheet && (
            <CustomButton
              title="Backup encryption"
              tagline="Encrypt all your backups."
              onPress={toggleEncryptedBackups}
              customComponent={
                <ToggleSwitch
                  isOn={settings.encryptedBackup}
                  onColor={colors.accent}
                  offColor={colors.icon}
                  size="small"
                  animationSpeed={150}
                  onToggle={toggleEncryptedBackups}
                />
              }
            />
          )}
        </>
      )}
    </>
  );
};
