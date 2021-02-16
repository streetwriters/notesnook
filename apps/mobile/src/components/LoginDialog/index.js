import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Modal, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button} from '../../components/Button';
import Seperator from '../../components/Seperator';
import {Toast} from '../../components/Toast';
import {Actions} from '../../provider/Actions';
import {useTracked} from '../../provider/index';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {clearMessage, setEmailVerifyMessage} from '../../services/Message';
import PremiumService from '../../services/PremiumService';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {
  eOpenLoginDialog,
  eOpenRecoveryKeyDialog,
  refreshNotesPage,
} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import BaseDialog from '../Dialog/base-dialog';
import Input from '../Input';
import {Header} from '../SimpleList/header';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const MODES = {
  login: 0,
  signup: 1,
  forgotPassword: 2,
  changePassword: 3,
};

let email;
let username;
let password;
let confirmPassword;
let oldPassword;

const LoginDialog = () => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userConsent, setUserConsent] = useState(false);
  const [mode, setMode] = useState(MODES.login);
  const [error, setError] = useState(false);
  const insets = useSafeAreaInsets();

  const _email = useRef();
  const _pass = useRef();
  const _username = useRef();
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
      headerParagraph: 'create a new account',
      showForgotButton: true,
      loading: 'Please wait while we log in and sync your data.',
      showLoader: true,
      buttonAlt: 'Sign Up',
      buttonAltFunc: () => {
        setMode(MODES.signup);
      },
    },
    {
      headerButton: 'Sign Up',
      headerButtonFunc: () => {
        setMode(MODES.login);
      },
      button: 'Create Account',
      buttonFunc: () => signupUser(),
      headerParagraph: 'login to your account',
      showForgotButton: false,
      loading: 'Please wait while we set up your account.',
      showLoader: true,
      buttonAlt: 'Login',
      buttonAltFunc: () => {
        setMode(MODES.login);
      },
    },
    {
      headerButton: 'Forgot Password',
      headerButtonFunc: () => {
        setMode(MODES.login);
      },
      button: 'Send Recovery Email',
      buttonFunc: () => sendEmail(),
      headerParagraph: 'login to your account',
      showForgotButton: false,
      loading:
        'Please follow the link in the email to set up your new password. If you are unable to find our email, check your spam folder.',
      showLoader: false,
      buttonAlt: 'Login',
      buttonAltFunc: () => {
        setMode(MODES.login);
      },
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
      buttonAlt: null,
    },
  ];

  const current = MODE_DATA[mode];

  useEffect(() => {
    eSubscribeEvent(eOpenLoginDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenLoginDialog, open);
    };
  }, []);

  function open(mode) {
    setMode(mode ? mode : MODES.login);
    setStatus(null);
    setVisible(true);
  }

  const close = () => {
    if (loading) return;
    _email.current?.clear();
    _pass.current?.clear();
    _passConfirm.current?.clear();
    _username.current?.clear();

    email = null;
    password = null;
    confirmPassword = null;
    oldPassword = null;
    setVisible(false);
    setUserConsent(false);
    setError(false);
    setLoading(false);
    setStatus(null);
    setMode(MODES.login);
  };

  const loginUser = async () => {
    if (!password || !email || error) {
      ToastEvent.show('Email or password is invalid', 'error', 'local');
      return;
    }
    setLoading(true);
    _email.current?.blur();
    _pass.current?.blur();
    setStatus('Logging in');
    let user;
    try {
      await db.user.login(email.toLowerCase(), password, true);
      user = await db.user.getUser();
      if (!user) throw new Error('Email or passoword incorrect!');
      setStatus('Syncing Your Data');
      PremiumService.setPremiumStatus();
      dispatch({type: Actions.USER, user: user});
      clearMessage(dispatch);
      ToastEvent.show(`Logged in as ${user.email}`, 'success', 'local');
      await db.sync();
      dispatch({type: Actions.LAST_SYNC, lastSync: await db.lastSynced()});
      dispatch({type: Actions.ALL});
      eSendEvent(refreshNotesPage);
      close();
    } catch (e) {
      setLoading(false);
      setStatus(null);
      if (user && !user.isEmailConfirmed) {
        close();
        setEmailVerifyMessage(dispatch);
        await sleep(500);
        console.log('showing verify email dialog');
        PremiumService.showVerifyEmailDialog();
      } else {
        ToastEvent.show(e.message, 'error', 'local');
      }
    }
  };

  const validateInfo = () => {
    if (!password || !email || !confirmPassword) {
      ToastEvent.show('All fields are required', 'error', 'local');
      return false;
    }

    if (error) {
      ToastEvent.show('Signup information is invalid', 'error', 'local');
      return false;
    }

    if (!userConsent) {
      ToastEvent.show(
        'You must agree to our terms of service and privacy policy.',
        'error',
        'local',
        5000,
        () => {
          setUserConsent(true);
          signupUser();
          ToastEvent.hide();
        },
        'I Agree',
      );
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
      dispatch({type: Actions.USER, user: user});
      dispatch({type: Actions.LAST_SYNC, lastSync: await db.lastSynced()});
      clearMessage(dispatch);
      setEmailVerifyMessage(dispatch);
      close();
      await sleep(300);
      eSendEvent(eOpenRecoveryKeyDialog, true);
    } catch (e) {
      setStatus(null);
      setLoading(false);
      ToastEvent.show(e.message, 'error', 'local');
    }
  };

  const sendEmail = async () => {
    if (!email || error) {
      ToastEvent.show('Account email is required.', 'error', 'local');
      return;
    }
    try {
      let lastRecoveryEmailTime = await MMKV.getItem('lastRecoveryEmailTime');
      if (
        lastRecoveryEmailTime &&
        Date.now() - JSON.parse(lastRecoveryEmailTime) < 60000 * 10
      ) {
        throw new Error('Please wait before requesting another email');
      }
      setStatus('Password Recovery Email Sent!');
      await db.user.recoverAccount(email);
      await MMKV.setItem('lastRecoveryEmailTime', JSON.stringify(Date.now()));
    } catch (e) {
      setStatus(null);
      ToastEvent.show(e.message, 'error', 'local');
    }
  };

  const changePassword = async () => {
    if (error || !oldPassword || !password) {
      ToastEvent.show('All fields are required', 'error', 'local');
      return;
    }
    setLoading(true);
    setStatus('Setting new Password');
    try {
      await db.user.changePassword(oldPassword, password);
    } catch (e) {
      setStatus(null);
      ToastEvent.show(e.message, 'error', 'local');
    }
    setStatus(null);
    setLoading(false);
  };

  return !visible ? null : (
    <Modal
      animated={true}
      animationType={DDS.isLargeTablet() ? 'fade' : 'slide'}
      statusBarTranslucent={true}
      onRequestClose={close}
      visible={true}
      transparent={true}>
      {status ? (
        <BaseDialog
          visible={true}
          transparent={current.showLoader}
          animation="slide"
          onRequestClose={() => {
            if (!current.showLoader) {
              setStatus(null);
            }
          }}>
          <View
            style={{
              alignItems: 'center',
              position: 'absolute',
              bottom: 0,
              paddingHorizontal: 12,
              backgroundColor: colors.nav,
              paddingTop: 10,
              paddingBottom: 20,
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <View
              style={{
                maxWidth: '80%',
              }}>
              <Heading size={SIZE.md}>{status}</Heading>
              <Paragraph style={{maxWidth: '100%'}} color={colors.icon}>
                {current.loading}
                {!current.showLoader ? null : (
                  <Paragraph color={colors.errorText}>
                    {'\n'}
                    Do not close the app.
                  </Paragraph>
                )}
              </Paragraph>
            </View>

            {!current.showLoader ? (
              <Button
                title="Ok"
                width={50}
                onPress={() => {
                  setStatus(null);
                }}
                type="accent"
              />
            ) : (
              <ActivityIndicator size={SIZE.xxxl} color={colors.accent} />
            )}
          </View>
          {/* <DialogContainer>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
              }}>
              <Heading>{status}</Heading>
              <Paragraph style={{textAlign: 'center'}}>
                {current.loading}

                {!current.showLoader ? null : (
                  <Paragraph color={colors.errorText}>
                    {' '}
                    Do not close the app.
                  </Paragraph>
                )}
              </Paragraph>
            </View>
            {!current.showLoader ? null : (
              <ActivityIndicator color={colors.accent} />
            )}
          </DialogContainer> */}
        </BaseDialog>
      ) : null}
      <View
        style={{
          opacity: 1,
          flex: 1,
          paddingTop: DDS.isLargeTablet() ? 0 : insets.top,
          backgroundColor: DDS.isLargeTablet() ? 'rgba(0,0,0,0.3)' : colors.bg,
          width: '100%',
          height: '100%',
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
        {DDS.isLargeTablet() ? (
          <TouchableOpacity
            onPress={close}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              zIndex: 1,
            }}
          />
        ) : null}
        <View
          style={{
            maxHeight: DDS.isLargeTablet() ? '90%' : '100%',
            minHeight: '50%',
            height: DDS.isLargeTablet() ? null : '100%',
            width: DDS.isLargeTablet() ? 500 : '100%',
            borderRadius: DDS.isLargeTablet() ? 5 : 0,
            backgroundColor: colors.bg,
            zIndex: 10,
            ...getElevation(DDS.isLargeTablet() ? 5 : 0),
            paddingBottom: DDS.isLargeTablet() ? 20 : 0,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              height: 50,
            }}>
            {DDS.isLargeTablet() ? (
              <ActionIcon
                name="close"
                size={SIZE.xxxl}
                onPress={() => {
                  close();
                }}
                customStyle={{
                  width: 40,
                  height: 40,
                  marginLeft: -5,
                }}
                color={colors.heading}
              />
            ) : (
              <ActionIcon
                name="arrow-left"
                size={SIZE.xxxl}
                onPress={() => {
                  close();
                }}
                customStyle={{
                  width: 40,
                  height: 40,
                  marginLeft: -5,
                }}
                color={colors.heading}
              />
            )}

            <View />
          </View>

          <Header
            color="transparent"
            type="login"
            shouldShow
            title={current.headerButton}
            messageCard={false}
            onPress={mode !== MODES.changePassword && current.headerButtonFunc}
            paragraph={mode !== MODES.changePassword && current.headerParagraph}
          />

          <View
            style={{
              paddingHorizontal: 12,
              paddingTop: 12,
            }}>
            {mode === MODES.changePassword ? null : (
              <Input
                fwdRef={_email}
                onChangeText={(value) => {
                  email = value;
                }}
                onErrorCheck={(r) => {
                  setError(r);
                }}
                validationType="email"
                autoCapitalize="none"
                errorMessage="Email is invalid"
                placeholder="Email"
                onSubmit={() => {
                  if (mode === MODES.signup) {
                    _pass.current?.focus();
                  }
                }}
              />
            )}

            {mode !== MODES.changePassword ? null : (
              <Input
                fwdRef={_oPass}
                onChangeText={(value) => {
                  oldPassword = value;
                }}
                onErrorCheck={(r) => {
                  setError(r);
                }}
                secureTextEntry
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
                  onChangeText={(value) => {
                    password = value;
                  }}
                  onErrorCheck={(r) => {
                    setError(r);
                  }}
                  marginBottom={0}
                  validationType={mode === MODES.signup ? 'password' : null}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Password"
                  errorMessage={mode === MODES.signup && 'Password is invalid'}
                  onSubmit={() => {
                    if (
                      mode === MODES.signup ||
                      mode === MODES.changePassword
                    ) {
                      _passConfirm.current?.focus();
                    } else {
                      current.buttonFunc();
                    }
                  }}
                />
              </>
            )}

            {mode === MODES.login && (
              <TouchableOpacity
                onPress={() => {
                  setMode(MODES.forgotPassword);
                }}
                style={{
                  alignSelf: 'flex-end',
                  marginTop: 2.5,
                }}>
                <Paragraph color={colors.accent}>Forgot password?</Paragraph>
              </TouchableOpacity>
            )}
            <Seperator />
            {mode !== MODES.signup && mode !== MODES.changePassword ? null : (
              <>
                <Input
                  fwdRef={_passConfirm}
                  onChangeText={(value) => {
                    confirmPassword = value;
                  }}
                  onErrorCheck={(r) => {
                    setError(r);
                  }}
                  loading={loading}
                  validationType="confirmPassword"
                  autoCapitalize="none"
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
                  onPress={() => {
                    setUserConsent(!userConsent);
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    alignItems: 'center',
                    height: 40,
                  }}>
                  <Icon
                    size={SIZE.lg}
                    color={userConsent ? colors.accent : colors.icon}
                    name={
                      userConsent
                        ? 'check-circle-outline'
                        : 'checkbox-blank-circle-outline'
                    }
                  />

                  <Paragraph
                    style={{
                      maxWidth: '90%',
                      marginLeft: 10,
                    }}>
                    By signing up you agree to our{' '}
                    <Paragraph color={colors.accent}>
                      terms of service{' '}
                    </Paragraph>
                    and{' '}
                    <Paragraph color={colors.accent}>privacy policy.</Paragraph>
                  </Paragraph>
                </TouchableOpacity>
              </>
            )}

            {mode !== MODES.signup ? null : <Seperator />}

            <Button
              title={current.button}
              onPress={current.buttonFunc}
              width="100%"
              type="accent"
              fontSize={SIZE.md}
              height={50}
            />

            {current.buttonAlt && (
              <Button
                title={current.buttonAlt}
                onPress={current.buttonAltFunc}
                width="100%"
                type="shade"
                fontSize={SIZE.md}
                style={{
                  marginTop: 10,
                }}
                height={50}
              />
            )}
          </View>
        </View>
        <Toast context="local" />
      </View>
    </Modal>
  );
};

export default LoginDialog;
