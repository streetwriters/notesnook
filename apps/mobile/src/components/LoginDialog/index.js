import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Modal, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
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
import {clearMessage} from '../../services/Message';
import {
  validateEmail,
  validatePass,
  validateUsername,
} from '../../services/Validation';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {
  eOpenLoginDialog,
  eOpenRecoveryKeyDialog,
  eStartSyncer,
  refreshNotesPage,
} from '../../utils/Events';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import {ListHeaderComponent} from '../SimpleList/ListHeaderComponent';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const MODES = {
  login: 0,
  signup: 1,
  forgotPassword: 2,
  changePassword: 3,
};

const LoginDialog = () => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  //const [username, setUsername] = useState(null);
  //const [invalidUsername, setInvalidUsername] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState(null);
  const [passwordReEnter, setPasswordReEnter] = useState(null);
  const [failed, setFailed] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [userConsent, setUserConsent] = useState(false);
  const [mode, setMode] = useState(MODES.login);

  const _email = useRef();
  const _pass = useRef();
  const _username = useRef();
  const _oldPass = useRef();
  const _oPass = useRef();
  const _passConfirm = useRef();
  const _passContainer = useRef();
  const insets = useSafeAreaInsets();

  const MODE_DATA = [
    {
      headerButton: 'Login',
      headerButtonFunc: () => {
        setMode(MODES.signup);
      },
      button: 'Login',
      buttonFunc: loginUser,
      headerParagraph: 'create a new account',
      showForgotButton: true,
      loading: 'Please wait while we log in and sync your data.',
      showLoader: true,
    },
    {
      headerButton: 'Sign Up',
      headerButtonFunc: () => {
        setMode(MODES.login);
      },
      button: 'Create Account',
      buttonFunc: signupUser,
      headerParagraph: 'login to your account',
      showForgotButton: false,
      loading: 'Please wait while we are setting up your account.',
      showLoader: true,
    },
    {
      headerButton: 'Forgot Password',
      headerButtonFunc: () => {
        setMode(MODES.signup);
      },
      button: 'Send Recovery Email',
      buttonFunc: sendEmail,
      headerParagraph: 'login to your account',
      showForgotButton: false,
      loading:
        'We have sent you a recovery email on ' +
        email +
        '. Follow the link in the email to set a new password',
      showLoader: false,
    },
    {
      headerButton: 'Change Password',
      headerButtonFunc: () => {
        setMode(MODES.signup);
      },
      button: 'Change Password',
      buttonFunc: changePassword,
      headerParagraph: 'login to your account',
      showForgotButton: false,
      loading:
        'Please wait while we change your password and encrypt your data.',
      showLoader: true,
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

    setVisible(true);
  }

  const close = () => {
    if (loggingIn || signingIn) return;
    _email.current?.clear();
    _pass.current?.clear();
    _passConfirm.current?.clear();
    _username.current?.clear();

    setVisible(false);
    //setUsername(null);
    setPassword(null);
    setConfirmPassword(null);
    setUserConsent(false);
    setEmail(null);
    setLoggingIn(false);
    setMode(MODES.login);
  };

  const loginUser = async () => {
    if (
      !password ||
      password.length < 8 ||
      !email ||
      invalidPassword ||
      invalidEmail
    ) {
      ToastEvent.show('email or password is invalid', 'error', 'local');
      return;
    }

    setLoggingIn(true);
    _email.current.blur();
    _pass.current.blur();
    setStatus('Logging in');

    try {
      await db.user.login(email.toLowerCase(), password, true);
    } catch (e) {
      ToastEvent.show(e.message, 'error', 'local');
      setLoggingIn(false);
      return;
    }

    try {
      let user = await db.user.get();
      if (!user) throw new Error('Email or passoword incorrect!');
      setStatus('Syncing Data');
      dispatch({type: Actions.USER, user: user});
      await db.sync();
      eSendEvent(eStartSyncer);
      dispatch({type: Actions.ALL});
      eSendEvent(refreshNotesPage);
      clearMessage(dispatch);
      close();
      ToastEvent.show(`Logged in as ${email}`, 'success', 'local');
    } catch (e) {
      console.warn(e);
      ToastEvent.show(e.message, 'error', 'local');
    } finally {
      setLoggingIn(false);
    }
  };

  const validateInfo = () => {
    if (!password || !email || !passwordReEnter) {
      ToastEvent.show('All fields are required', 'error', 'local');
      return false;
    }

    if (!confirmPassword) {
      ToastEvent.show('Passwords do not match', 'error', 'local');
      return false;
    }

    if (invalidEmail && invalidPassword) {
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
    setSigningIn(true);
    setStatus('Creating User');
    try {
      await db.user.signup(email, password);
    } catch (e) {
      setSigningIn(false);
      setFailed(true);
      ToastEvent.show('Signup failed, Network Error', 'error', 'local');
      return;
    }

    let user;
    try {
      user = await db.user.get();
      setStatus('Setting up crenditials');
      dispatch({type: Actions.USER, user: user});
      eSendEvent(eStartSyncer);
      clearMessage(dispatch);
      close();
      await sleep(500);
      eSendEvent(eOpenRecoveryKeyDialog, true);
    } catch (e) {
      setFailed(true);
      ToastEvent.show('Login Failed, try again', 'error', 'local');
    } finally {
      setSigningIn(false);
    }
  };

  const sendEmail = () => {
    setStatus('Recovery Email Sent!');
  };

  const changePassword = () => {};

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
          onRequestClose={() => {
            if (!current.showLoader) {
              setStatus(null);
            }
          }}>
          <DialogContainer>
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
          </DialogContainer>
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
          <Toast context="local" />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              height: 50,
            }}>
            {DDS.isLargeTablet() ? (
              <View />
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

          <ListHeaderComponent
            color="transparent"
            type="settings"
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
            {/*    {mode === MODES.forgotPassword ||
            mode === MODES.changePassword ? null : (
              <>
                <TextInput
                  ref={_username}
                  onFocus={() => {
                    if (!invalidUsername) {
                      _username.current?.setNativeProps({
                        style: {
                          borderColor: colors.accent,
                        },
                      });
                    }
                  }}
                  editable={!loggingIn || !signingIn}
                  autoCapitalize="none"
                  defaultValue={username}
                  onBlur={() => {
                    if (!validateUsername(username) && username?.length > 0) {
                      setInvalidUsername(true);
                      _username.current?.setNativeProps({
                        style: {
                          color: colors.errorText,
                          borderColor: colors.errorText,
                        },
                      });
                    } else {
                      setInvalidUsername(false);
                      _username.current?.setNativeProps({
                        style: {
                          borderColor: colors.nav,
                        },
                      });
                    }
                  }}
                  textContentType="username"
                  onChangeText={(value) => {
                    setUsername(value);

                    if (invalidUsername && validateUsername(username)) {
                      setInvalidUsername(false);
                      _username.current.setNativeProps({
                        style: {
                          color: colors.pri,
                          borderColor: colors.accent,
                        },
                      });
                    }
                  }}
                  onSubmitEditing={() => {
                    if (!validateUsername(username)) {
                      setInvalidUsername(true);
                      _username.current.setNativeProps({
                        style: {
                          color: colors.errorText,
                        },
                      });
                    }
                    _pass.current?.focus();
                  }}
                  blurOnSubmit={false}
                  style={{
                    paddingHorizontal: 0,
                    height: 50,
                    borderBottomWidth: 1,
                    borderColor: colors.nav,
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.regular,
                    color: colors.pri,
                  }}
                  placeholder="Username (a-z _- 0-9)"
                  placeholderTextColor={colors.icon}
                />
                {invalidUsername ? (
                  <Paragraph
                    size={SIZE.xs}
                    style={{
                      textAlign: 'right',
                      textAlignVertical: 'bottom',
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Username is invalid
                  </Paragraph>
                ) : null}
              </>
            )} */}
            <Seperator />

            {mode !== MODES.signup && mode !== MODES.login ? null : (
              <>
                <TextInput
                  ref={_email}
                  onFocus={() => {
                    if (!invalidEmail) {
                      _email.current.setNativeProps({
                        style: {
                          borderColor: colors.accent,
                        },
                      });
                    }
                  }}
                  editable={!loggingIn || !signingIn}
                  autoCapitalize="none"
                  defaultValue={email}
                  onBlur={() => {
                    if (!validateEmail(email) && email?.length > 0) {
                      setInvalidEmail(true);
                      _email.current?.setNativeProps({
                        style: {
                          color: colors.errorText,
                          borderColor: colors.errorText,
                        },
                      });
                    } else {
                      setInvalidEmail(false);
                      _email.current?.setNativeProps({
                        style: {
                          borderColor: colors.nav,
                        },
                      });
                    }
                  }}
                  textContentType="emailAddress"
                  onChangeText={(value) => {
                    setEmail(value);
                    if (invalidEmail && validateEmail(email)) {
                      setInvalidEmail(false);
                      _email.current.setNativeProps({
                        style: {
                          color: colors.pri,
                          borderColor: colors.accent,
                        },
                      });
                    }
                  }}
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (!validateEmail(email)) {
                      setInvalidEmail(true);
                      _email.current.setNativeProps({
                        style: {
                          color: colors.errorText,
                        },
                      });
                    }
                    if (mode === MODES.signup) {
                      _pass.current?.focus();
                    }
                  }}
                  style={{
                    paddingHorizontal: 0,
                    height: 50,
                    borderBottomWidth: 1,
                    borderColor: colors.nav,
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.regular,
                    color: colors.pri,
                  }}
                  placeholder="Email"
                  placeholderTextColor={colors.icon}
                />

                {invalidEmail ? (
                  <Paragraph
                    size={SIZE.xs}
                    style={{
                      textAlign: 'right',
                      textAlignVertical: 'bottom',
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Email is invalid
                  </Paragraph>
                ) : null}
                <Seperator />
              </>
            )}

            {mode !== MODES.changePassword ? null : (
              <>
                <View
                  ref={_oldPass}
                  style={{
                    borderBottomWidth: 1,
                    borderColor: colors.nav,
                    paddingHorizontal: 0,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TextInput
                    ref={_oPass}
                    editable={!loggingIn || !signingIn}
                    autoCapitalize="none"
                    defaultValue={oldPassword}
                    onChangeText={(value) => {
                      setOldPassword(value);
                    }}
                    onSubmitEditing={() => {
                      if (mode === MODES.changePassword) {
                        _pass.current?.focus();
                      }
                    }}
                    style={{
                      paddingHorizontal: 0,
                      height: 50,
                      fontSize: SIZE.md,
                      fontFamily: WEIGHT.regular,
                      width: '85%',
                      maxWidth: '85%',
                      color: colors.pri,
                    }}
                    secureTextEntry={secureEntry}
                    placeholder="Current Password"
                    placeholderTextColor={colors.icon}
                  />

                  <Icon
                    name="eye"
                    size={20}
                    onPress={() => {
                      setSecureEntry(!secureEntry);
                    }}
                    style={{
                      width: 25,
                    }}
                    color={secureEntry ? colors.icon : colors.accent}
                  />
                </View>

                {invalidPassword ? (
                  <Paragraph
                    size={SIZE.xs}
                    style={{
                      textAlign: 'right',
                      textAlignVertical: 'bottom',
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Password is invalid
                  </Paragraph>
                ) : null}

                <Seperator />
              </>
            )}

            {mode === MODES.forgotPassword ? null : (
              <>
                <View
                  ref={_passContainer}
                  style={{
                    borderBottomWidth: 1,
                    borderColor: colors.nav,
                    paddingHorizontal: 0,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TextInput
                    ref={_pass}
                    onFocus={() => {
                      if (!invalidPassword) {
                        _passContainer.current?.setNativeProps({
                          style: {
                            borderColor: colors.accent,
                          },
                        });
                      }
                    }}
                    editable={!loggingIn || !signingIn}
                    autoCapitalize="none"
                    defaultValue={password}
                    onBlur={() => {
                      if (!validatePass(password) && password?.length > 0) {
                        setInvalidPassword(true);
                        _pass.current?.setNativeProps({
                          style: {
                            color: colors.errorText,
                          },
                        });
                        _passContainer.current?.setNativeProps({
                          style: {
                            borderColor: colors.errorText,
                          },
                        });
                      } else {
                        setInvalidPassword(false);
                        _passContainer.current?.setNativeProps({
                          style: {
                            borderColor: colors.nav,
                          },
                        });
                      }
                    }}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (invalidPassword && validatePass(password)) {
                        setInvalidPassword(false);
                        _pass.current.setNativeProps({
                          style: {
                            color: colors.pri,
                          },
                        });
                      }
                    }}
                    onSubmitEditing={() => {
                      if (!validatePass(password)) {
                        setInvalidPassword(true);
                        _pass.current.setNativeProps({
                          style: {
                            color: colors.errorText,
                          },
                        });
                      }
                      if (
                        mode === MODES.signup ||
                        mode === MODES.changePassword
                      ) {
                        _passConfirm.current?.focus();
                      } else {
                        current.buttonFunc();
                      }
                    }}
                    blurOnSubmit={false}
                    style={{
                      paddingHorizontal: 0,
                      height: 50,
                      fontSize: SIZE.md,
                      fontFamily: WEIGHT.regular,
                      width: '85%',
                      maxWidth: '85%',
                      color: colors.pri,
                    }}
                    secureTextEntry={secureEntry}
                    placeholder="Password (6+ characters)"
                    placeholderTextColor={colors.icon}
                  />

                  <Icon
                    name="eye"
                    size={20}
                    onPress={() => {
                      setSecureEntry(!secureEntry);
                    }}
                    style={{
                      width: 25,
                    }}
                    color={secureEntry ? colors.icon : colors.accent}
                  />
                </View>
                {mode === MODES.login ? (
                  <TouchableOpacity
                    onPress={() => {
                      setMode(MODES.forgotPassword);
                    }}
                    style={{
                      alignSelf: 'flex-end',
                      marginTop: 2.5,
                    }}>
                    <Paragraph color={colors.accent}>
                      Forgot password?
                    </Paragraph>
                  </TouchableOpacity>
                ) : null}
                {invalidPassword ? (
                  <Paragraph
                    size={SIZE.xs}
                    style={{
                      textAlign: 'right',
                      textAlignVertical: 'bottom',
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Password is invalid
                  </Paragraph>
                ) : null}

                <Seperator />
              </>
            )}

            {mode !== MODES.signup && mode !== MODES.changePassword ? null : (
              <>
                <TextInput
                  ref={_passConfirm}
                  editable={
                    !loggingIn || !signingIn || (password && !invalidPassword)
                      ? true
                      : false
                  }
                  defaultValue={passwordReEnter}
                  autoCapitalize="none"
                  onChangeText={(value) => {
                    setPasswordReEnter(value);
                    if (value !== password) {
                      setConfirmPassword(false);
                      _passConfirm.current.setNativeProps({
                        style: {
                          borderColor: colors.errorText,
                        },
                      });
                      _pass.current.setNativeProps({
                        style: {
                          borderColor: colors.errorText,
                        },
                      });
                    } else {
                      setConfirmPassword(true);
                      _passConfirm.current.setNativeProps({
                        style: {
                          borderColor: colors.accent,
                        },
                      });
                      _pass.current.setNativeProps({
                        style: {
                          borderColor: colors.accent,
                        },
                      });
                    }
                  }}
                  onFocus={() => {
                    _passConfirm.current.setNativeProps({
                      style: {
                        borderColor: colors.accent,
                      },
                    });
                  }}
                  onSubmitEditing={() => {
                    current.buttonFunc();
                  }}
                  blurOnSubmit
                  style={{
                    paddingHorizontal: 0,
                    borderBottomWidth: 1,
                    height: 50,
                    borderColor: colors.nav,
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.regular,
                    color: colors.pri,
                  }}
                  secureTextEntry={secureEntry}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.icon}
                />

                {password && !invalidPassword && !confirmPassword ? (
                  <Paragraph
                    size={SIZE.xs}
                    style={{
                      textAlign: 'right',
                      textAlignVertical: 'bottom',
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Passwords do not match
                  </Paragraph>
                ) : null}

                <Seperator />
              </>
            )}

            {mode !== MODES.signup ? null : (
              <>
                <TouchableOpacity
                  disabled={loggingIn || signingIn}
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
              loading={loggingIn || signingIn}
              fontSize={SIZE.md}
              height={50}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LoginDialog;
