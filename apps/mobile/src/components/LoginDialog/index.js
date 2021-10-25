import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button} from '../../components/Button';
import Seperator from '../../components/Seperator';
import {useTracked} from '../../provider/index';
import {useUserStore} from '../../provider/stores';
import BiometricService from '../../services/BiometricService';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import {clearMessage, setEmailVerifyMessage} from '../../services/Message';
import PremiumService from '../../services/PremiumService';
import {dHeight} from '../../utils';
import {hexToRGBA} from '../../utils/ColorUtils';
import {db} from '../../utils/database';
import {
  eOpenLoginDialog,
  eOpenProgressDialog,
  eOpenRecoveryKeyDialog
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogContainer from '../Dialog/dialog-container';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import {Header} from '../SimpleList/header';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const MODES = {
  login: 0,
  signup: 1,
  forgotPassword: 2,
  changePassword: 3,
  sessionExpired: 4
};

let email = '';
let password = '';
let confirmPassword;
let oldPassword;

function getEmail() {
  if (!email) return null;
  return email.replace(/(.{2})(.*)(?=@)/, function (gp1, gp2, gp3) {
    for (let i = 0; i < gp3.length; i++) {
      gp2 += '*';
    }
    return gp2;
  });
}
const LoginDialog = () => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;

  const setUser = useUserStore(state => state.setUser);
  const setLastSynced = useUserStore(state => state.setLastSynced);

  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userConsent, setUserConsent] = useState(true);
  const [mode, setMode] = useState(MODES.login);
  const [error, setError] = useState(false);
  const [focused, setFocused] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const scrollViewRef = useRef();
  const actionSheetRef = useRef();
  const _email = useRef();
  const _pass = useRef();
  const _oPass = useRef();
  const _passConfirm = useRef();

  const MODE_DATA = [
    {
      headerButton: 'Login',
      headerButtonFunc: () => {
        setMode(MODES.signup);
      },
      button: 'Login',
      buttonFunc: () => loginUser(),
      headerParagraph: 'Create a new account',
      showForgotButton: true,
      loading: 'Please wait while we log in and sync your data.',
      showLoader: true,
      buttonAlt: 'Sign Up',
      buttonAltFunc: () => {
        setMode(MODES.signup);
      }
    },
    {
      headerButton: 'Sign Up',
      headerButtonFunc: () => {
        _email.current?.blur();
        setMode(MODES.login);
        onChangeFocus();
      },
      button: 'Create Account',
      buttonFunc: () => signupUser(),
      headerParagraph: 'Login to your account',
      showForgotButton: false,
      loading: 'Please wait while we set up your account.',
      showLoader: true,
      buttonAlt: 'Login',
      buttonAltFunc: () => {
        _email.current?.blur();
        setMode(MODES.login);
        onChangeFocus();
      }
    },
    {
      headerButton: 'Forgot Password',
      headerButtonFunc: () => {
        _email.current?.blur();
        setMode(MODES.login);
        onChangeFocus();
      },
      button: 'Send Recovery Email',
      buttonFunc: () => sendEmail(),
      headerParagraph: 'Login to your account',
      showForgotButton: false,
      loading:
        'Please follow the link in the email to set up your new password. If you are unable to find our email, check your spam folder.',
      showLoader: false,
      buttonAlt: 'Go back to Login',
      buttonAltFunc: () => {
        setMode(MODES.login);
      }
    },
    {
      headerButton: 'Change Password',
      headerButtonFunc: () => {
        setMode(MODES.signup);
      },
      button: 'Change Password',
      buttonFunc: () => changePassword(),
      headerParagraph: 'login to your account',
      showForgotButton: false,
      loading:
        'Please wait while we change your password and encrypt your data.',
      showLoader: true,
      buttonAlt: null
    },
    {
      headerButton: 'Session expired',
      headerButtonFunc: () => {},
      button: 'Login',
      buttonFunc: () => loginUser(),
      headerParagraph: '',
      showForgotButton: true,
      loading: 'Please wait while we log in and sync your data.',
      showLoader: true,
      buttonAlt: 'Logout & delete data',
      buttonAltFunc: () => {
        setConfirm(true);
      }
    }
  ];

  const current = MODE_DATA[mode];

  useEffect(() => {
    eSubscribeEvent(eOpenLoginDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenLoginDialog, open);
    };
  }, []);

  async function open(mode) {
    setMode(mode ? mode : MODES.login);
    if (mode === MODES.sessionExpired) {
      let user = await db.user.getUser();
      email = user.email;
    }
    setStatus(null);
    setVisible(true);
    await sleep(10);
    actionSheetRef.current?.show();
  }

  const close = () => {
    if (loading) return;
    actionSheetRef.current?.hide();
    confirmPassword = null;
    oldPassword = null;
    email = null;
    password = null;
    setUserConsent(false);
    setError(false);
    setLoading(false);
    setStatus(null);
    setMode(MODES.login);
    setVisible(false);
  };

  const loginUser = async () => {
    if (!password || !email || error) {
      ToastEvent.show({
        heading: 'Email or password is invalid',
        type: 'error',
        context: 'local'
      });
      return;
    }
    setLoading(true);
    _email.current?.blur();
    _pass.current?.blur();
    setStatus('Logging in');
    let user;
    try {
      await db.user.login(email.toLowerCase(), password);
      user = await db.user.getUser();
      if (!user) throw new Error('Email or password incorrect!');
      setStatus('Syncing Your Data');
      PremiumService.setPremiumStatus();
      setUser(user);
      clearMessage();
      ToastEvent.show({
        heading: 'Login successful',
        message: `Logged in as ${user.email}`,
        type: 'success',
        context: 'local'
      });
      close();
      await sleep(300);
      eSendEvent('userLoggedIn', true);
      eSendEvent(eOpenProgressDialog, {
        title: 'Syncing your data',
        paragraph: 'Please wait while we sync all your data.',
        noProgress: false
      });
      await MMKV.removeItem('loginSessionHasExpired');
    } catch (e) {
      setLoading(false);
      setStatus(null);
      ToastEvent.show({
        heading: user ? 'Failed to sync' : 'Login failed',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  const validateInfo = () => {
    if (!password || !email || !confirmPassword) {
      ToastEvent.show({
        heading: 'All fields required',
        message: 'Fill all the fields and try again',
        type: 'error',
        context: 'local'
      });

      return false;
    }

    if (error) {
      ToastEvent.show({
        heading: 'Invalid signup information',
        message:
          'Some or all information provided is invalid. Resolve all errors and try again.',
        type: 'error',
        context: 'local'
      });
      return false;
    }

    if (!userConsent) {
      ToastEvent.show({
        heading: 'Cannot signup',
        message: 'You must agree to our terms of service and privacy policy.',
        type: 'error',
        context: 'local',
        actionText: 'I Agree',
        duration: 5000,
        func: () => {
          setUserConsent(true);
          signupUser();
          ToastEvent.hide();
        }
      });
      return false;
    }

    return true;
  };

  const signupUser = async () => {
    if (!validateInfo()) return;
    setLoading(true);
    setStatus('Creating Account');
    try {
      await db.user.signup(email, password);
      let user = await db.user.getUser();
      setStatus('Setting Crenditials');
      setUser(user);
      setLastSynced(await db.lastSynced());
      clearMessage();
      setEmailVerifyMessage();
      close();
      await sleep(300);
      eSendEvent(eOpenRecoveryKeyDialog, true);
    } catch (e) {
      setStatus(null);
      setLoading(false);
      ToastEvent.show({
        heading: 'Signup failed',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  const sendEmail = async nostatus => {
    if (!email || error) {
      ToastEvent.show({
        heading: 'Account email is required.',
        type: 'error',
        context: 'local'
      });
      return;
    }
    try {
      let lastRecoveryEmailTime = await MMKV.getItem('lastRecoveryEmailTime');
      if (
        lastRecoveryEmailTime &&
        Date.now() - JSON.parse(lastRecoveryEmailTime) < 60000 * 3
      ) {
        throw new Error('Please wait before requesting another email');
      }
      !nostatus && setStatus('Password Recovery Email Sent!');
      await db.user.recoverAccount(email);
      await MMKV.setItem('lastRecoveryEmailTime', JSON.stringify(Date.now()));
      ToastEvent.show({
        heading: `Check your email to reset password`,
        message: `Recovery email has been sent to ${email}`,
        type: 'success',
        context: 'local',
        duration: 7000
      });
    } catch (e) {
      setStatus(null);
      ToastEvent.show({
        heading: 'Recovery email not sent',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  const changePassword = async () => {
    if (error || !oldPassword || !password) {
      ToastEvent.show({
        heading: 'All fields required',
        message: 'Fill all the fields and try again.',
        type: 'error',
        context: 'local'
      });
      return;
    }
    setLoading(true);
    setStatus('Setting new Password');
    try {
      await db.user.changePassword(oldPassword, password);
      ToastEvent.show({
        heading: `Account password updated`,
        type: 'success',
        context: 'local'
      });
    } catch (e) {
      setStatus(null);
      ToastEvent.show({
        heading: 'Failed to change password',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
    setStatus(null);
    setLoading(false);
  };

  const onChangeFocus = () => {
    setFocused(!focused);
    setTimeout(() => {
      _email.current?.focus();
    }, 50);
  };

  return !visible ? null : (
    <ActionSheetWrapper
      fwdRef={actionSheetRef}
      animation={DDS.isTab ? 'fade' : 'slide'}
      statusBarTranslucent={false}
      gestureEnabled={MODES.sessionExpired !== mode}
      closeOnTouchBackdrop={MODES.sessionExpired !== mode}
      onRequestClose={MODES.sessionExpired !== mode && close}
      keyboardMode="position"
      visible={true}
      onClose={close}
      onOpen={() => {
        setTimeout(() => {
          if (MODES.sessionExpired === mode) {
            _pass.current?.focus();
            return;
          }
          _email.current?.focus();
        }, 300);
      }}
      background={!DDS.isTab ? colors.bg : null}
      transparent={true}>
      {confirm && (
        <BaseDialog
          onRequestClose={() => {
            setConfirm(false);
          }}
          visible>
          <DialogContainer>
            <DialogHeader
              title="Logout & delete data"
              paragraph="All synced and unsynced data on this device will be removed. Do you want to proceed?"
              paragraphColor="red"
            />
            <DialogButtons
              negativeTitle="Cancel"
              onPressNegative={() => {
                setConfirm(false);
              }}
              positiveType="error"
              positiveTitle="Logout"
              onPressPositive={async () => {
                try {
                  await db.user.logout();
                  await BiometricService.resetCredentials();
                  await Storage.write('introCompleted', 'true');
                  setConfirm(false);
                  close();
                } catch (e) {
                  ToastEvent.show({
                    heading: e.message,
                    type: 'error',
                    context: 'local'
                  });
                }
              }}
            />
          </DialogContainer>
        </BaseDialog>
      )}

      {status ? (
        <BaseDialog
          visible={true}
          transparent={current.showLoader}
          animation="slide"
          onRequestClose={() => {
            if (!current.showLoader) {
              setStatus(null);
            }
          }}
        />
      ) : null}

      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={mode !== MODES.sessionExpired}
        onMomentumScrollEnd={() => {
          actionSheetRef.current.handleChildScrollEnd();
        }}
        bounces={false}
        overScrollMode="never"
        scrollToOverflowEnabled="false"
        style={{
          borderRadius: DDS.isTab ? 5 : 0,
          backgroundColor: colors.bg,
          zIndex: 10,
          minHeight: DDS.isTab ? '50%' : '85%'
        }}>
        <Header
          color="transparent"
          type="login"
          height={150}
          noAnnouncement={true}
          shouldShow
          title={current.headerButton}
          messageCard={false}
        />
        {mode === MODES.sessionExpired && (
          <View
            style={{
              width: '100%',
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: hexToRGBA(colors.red, 0.2)
            }}>
            <Icon
              size={20}
              style={{marginRight: 10}}
              name="information"
              color={colors.errorText}
            />
            <Paragraph style={{maxWidth: '90%'}} color={colors.errorText}>
              Please login to your account to access your notes on this device
              and sync them.
            </Paragraph>
          </View>
        )}

        {mode === MODES.signup && (
          <View
            style={{
              width: '100%',
              backgroundColor: colors.shade,
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <Icon
              size={20}
              style={{marginRight: 10}}
              name="information"
              color={colors.accent}
            />
            <Paragraph style={{maxWidth: '90%'}} color={colors.accent}>
              When you sign up, your{' '}
              <Text style={{fontWeight: 'bold'}}>
                14 day free trial of Notesnook Pro
              </Text>{' '}
              will be activated.
            </Paragraph>
          </View>
        )}

        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 12,
            width: focused ? '100%' : '99.9%'
          }}>
          {mode === MODES.changePassword ? null : (
            <Input
              fwdRef={_email}
              onChangeText={value => {
                email = value;
              }}
              onErrorCheck={r => {
                setError(r);
              }}
              loading={MODES.sessionExpired === mode}
              defaultValue={MODES.sessionExpired === mode ? getEmail() : null}
              onFocusInput={onChangeFocus}
              returnKeyLabel="Next"
              returnKeyType="next"
              autoCompleteType="email"
              validationType="email"
              autoCapitalize="none"
              errorMessage="Email is invalid"
              placeholder="Email"
              onSubmit={() => {
                if (mode === MODES.signup || mode === MODES.login) {
                  _pass.current?.focus();
                }
              }}
            />
          )}

          {mode !== MODES.changePassword ? null : (
            <Input
              fwdRef={_oPass}
              onChangeText={value => {
                oldPassword = value;
              }}
              onErrorCheck={r => {
                setError(r);
              }}
              returnKeyLabel="Next"
              returnKeyType="next"
              secureTextEntry
              autoCompleteType="password"
              autoCapitalize="none"
              placeholder="Current password"
              onSubmit={() => {
                if (mode === MODES.signup) {
                  _pass.current?.focus();
                }
              }}
            />
          )}

          {mode === MODES.forgotPassword ? null : (
            <>
              <Input
                fwdRef={_pass}
                onChangeText={value => {
                  password = value;
                }}
                onErrorCheck={r => {
                  setError(r);
                }}
                marginBottom={0}
                validationType={mode === MODES.signup ? 'password' : null}
                secureTextEntry
                autoCompleteType="password"
                autoCapitalize="none"
                placeholder="Password"
                returnKeyLabel={mode === MODES.signup ? 'Next' : 'Login'}
                returnKeyType={mode === MODES.signup ? 'next' : 'done'}
                errorMessage={mode === MODES.signup && 'Password is invalid'}
                onSubmit={() => {
                  if (mode === MODES.signup || mode === MODES.changePassword) {
                    _passConfirm.current?.focus();
                  } else {
                    current.buttonFunc();
                  }
                }}
              />
            </>
          )}

          {mode === MODES.login || mode === MODES.sessionExpired ? (
            <TouchableOpacity
              onPress={() => {
                if (MODES.sessionExpired === mode) {
                  sendEmail(true);
                  return;
                }
                setMode(MODES.forgotPassword);
              }}
              style={{
                alignSelf: 'flex-end',
                marginTop: 2.5
              }}>
              <Paragraph color={colors.accent}>Forgot password?</Paragraph>
            </TouchableOpacity>
          ) : null}
          <Seperator />
          {mode !== MODES.signup && mode !== MODES.changePassword ? null : (
            <>
              <Input
                fwdRef={_passConfirm}
                onChangeText={value => {
                  confirmPassword = value;
                }}
                onErrorCheck={r => {
                  setError(r);
                }}
                loading={loading}
                validationType="confirmPassword"
                autoCapitalize="none"
                returnKeyLabel="Done"
                returnKeyType="done"
                customValidator={() => password}
                secureTextEntry
                placeholder="Confirm password"
                errorMessage="Passwords do not match"
                onSubmit={() => {
                  current.buttonFunc();
                }}
              />
            </>
          )}

          {mode !== MODES.signup ? null : (
            <>
              <TouchableOpacity
                disabled={loading}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center'
                }}>
                <Paragraph
                  size={11}
                  style={{
                    maxWidth: '90%'
                  }}>
                  By signing up you agree to our{' '}
                  <Paragraph
                    size={11}
                    onPress={() => {
                      openLinkInBrowser('https://notesnook.com/tos', colors)
                        .catch(e => {})
                        .then(r => {});
                    }}
                    color={colors.accent}>
                    terms of service{' '}
                  </Paragraph>
                  and{' '}
                  <Paragraph
                    size={11}
                    onPress={() => {
                      openLinkInBrowser('https://notesnook.com/privacy', colors)
                        .catch(e => {})
                        .then(r => {});
                    }}
                    color={colors.accent}>
                    privacy policy.
                  </Paragraph>
                </Paragraph>
              </TouchableOpacity>
            </>
          )}

          {mode !== MODES.signup ? null : <Seperator />}

          <Button
            title={loading ? '' : current.button}
            onPress={current.buttonFunc}
            width="100%"
            type="accent"
            fontSize={SIZE.md}
            loading={loading}
            height={50}
          />

          {current.buttonAlt && (
            <Button
              title={current.buttonAlt}
              onPress={current.buttonAltFunc}
              width="100%"
              type={MODES.sessionExpired === mode ? 'error' : 'shade'}
              fontSize={SIZE.md}
              style={{
                marginTop: 10
              }}
              height={50}
            />
          )}
        </View>
      </ScrollView>
    </ActionSheetWrapper>
  );
};

export default LoginDialog;
