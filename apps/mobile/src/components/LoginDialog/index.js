import CheckBox from '@react-native-community/checkbox';
import React, {createRef, useEffect, useState} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
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
import {opacity, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import {Loading} from '../Loading';
import {ListHeaderComponent} from '../SimpleList/ListHeaderComponent';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const LoginDialog = () => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('Logging you in');
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [username, setUsername] = useState(null);
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState(false);
  const [key, setKey] = useState('abc123');
  const [passwordReEnter, setPasswordReEnter] = useState(null);
  const [failed, setFailed] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [login, setLogin] = useState(true);
  const [userConsent, setUserConsent] = useState(false);
  const _email = createRef();
  const _pass = createRef();
  const _username = createRef();
  const _passConfirm = createRef();
  const _passContainer = createRef();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    eSubscribeEvent(eOpenLoginDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenLoginDialog, open);
    };
  }, []);

  function open() {
    setVisible(true);
  }

  const close = () => {
    _email.current?.clear();
    _pass.current?.clear();
    _passConfirm.current?.clear();
    _username.current?.clear();

    setVisible(false);
    setUsername(null);
    setPassword(null);
    setConfirmPassword(null);
    setKey(null);
    setLogin(true);
    setUserConsent(false);
    setEmail(false);
    setLoggingIn(false);
  };

  const loginUser = async () => {
    if (
      !password ||
      password.length < 8 ||
      !username ||
      invalidPassword ||
      invalidUsername
    ) {
      ToastEvent.show('username or password is invalid', 'error', 'local');
      return;
    }

    setLoggingIn(true);
    _username.current.blur();
    _pass.current.blur();
    setStatus('Logging in');

    try {
      let res = await db.user.login(username.toLowerCase(), password);
      console.log(res, username, password);
    } catch (e) {
      setTimeout(() => {
        ToastEvent.show(e.message, 'error', 'local');
        setLoggingIn(false);
      }, 500);
      return;
    }

    try {
      let user = await db.user.get();
      if (!user) throw new Error('Username or passoword incorrect!');
      setStatus('Syncing your notes');
      dispatch({type: Actions.USER, user: user});
      await db.sync();
      eSendEvent(eStartSyncer);
      dispatch({type: Actions.ALL});
      eSendEvent(refreshNotesPage);
      close();
      ToastEvent.show(`Logged in as ${username}`, 'success', 'local');
    } catch (e) {
      ToastEvent.show(e.message, 'error', 'local');
    } finally {
      setLoggingIn(false);
    }
  };

  const validateInfo = () => {
    if (!password || !email || !username || !passwordReEnter) {
      ToastEvent.show('All fields are required', 'error', 'local');
      return false;
    }

    if (!confirmPassword) {
      ToastEvent.show('Passwords do not match', 'error', 'local');
      return false;
    }
    console.log(invalidEmail, invalidPassword, invalidUsername);
    if (invalidEmail && invalidPassword && invalidUsername) {
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
    setStatus('Creating your account');
    try {
      await db.user.signup(username, email, password);
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

  return (
    <Modal
      animated={true}
      animationType={DDS.isTab ? 'fade' : 'slide'}
      statusBarTranslucent={true}
      onRequestClose={close}
      visible={visible}
      transparent={true}>
      <View
        style={{
          opacity: 1,
          flex: 1,
          paddingTop: DDS.isTab ? 0 : insets.top,
          backgroundColor: DDS.isTab ? 'rgba(0,0,0,0.3)' : colors.bg,
          width: '100%',
          height: '100%',
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
        {DDS.isTab ? (
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
            height:
              DDS.isTab && !DDS.isSmallTab
                ? login
                  ? '70%'
                  : '80%'
                : DDS.isSmallTab
                ? login
                  ? '50%'
                  : '65%'
                : '100%',
            width: DDS.isTab ? 500 : '100%',
            borderRadius: DDS.isTab ? 5 : 0,

            zIndex: 10,
            ...getElevation(DDS.isTab ? 5 : 0),
          }}>
          <Toast context="local" />

          {DDS.isTab ? null : (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
                height: 50,
              }}>
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
              <Paragraph
                onPress={() => setLogin(!login)}
                size={SIZE.md}
                color={colors.accent}>
                {login ? 'Sign Up' : 'Login'}
              </Paragraph>
            </View>
          )}

          <ListHeaderComponent
            color="transparent"
            type="settings"
            title={login ? 'Login' : 'Sign Up'}
            messageCard={false}
            onPress={() => {
              setLogin(!login);
            }}
            paragraph={login ? 'create an account' : 'login to your account'}
          />

          <View
            style={{
              paddingHorizontal: 12,
              paddingTop: 12,
            }}>
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
                }}
                style={{
                  paddingHorizontal: pv,
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
                <Text
                  style={{
                    textAlign: 'right',
                    fontFamily: WEIGHT.regular,
                    textAlignVertical: 'bottom',
                    fontSize: SIZE.xs,
                    marginTop: 2.5,
                  }}>
                  <Icon
                    name="alert-circle-outline"
                    size={SIZE.xs}
                    color={colors.errorText}
                  />{' '}
                  Username is invalid
                </Text>
              ) : null}
            </>

            <Seperator />

            {login ? null : (
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
                  onSubmitEditing={() => {
                    if (!validateEmail(email)) {
                      setInvalidEmail(true);
                      _email.current.setNativeProps({
                        style: {
                          color: colors.errorText,
                        },
                      });
                    }
                  }}
                  style={{
                    paddingHorizontal: pv,
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
                  <Text
                    style={{
                      textAlign: 'right',
                      fontFamily: WEIGHT.regular,
                      textAlignVertical: 'bottom',
                      fontSize: SIZE.xs,
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Email is invalid
                  </Text>
                ) : null}
                <Seperator />
              </>
            )}

            <View
              ref={_passContainer}
              style={{
                borderBottomWidth: 1,
                borderColor: colors.nav,
                paddingHorizontal: 10,
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
            {invalidPassword ? (
              <Text
                style={{
                  textAlign: 'right',
                  fontFamily: WEIGHT.regular,
                  textAlignVertical: 'bottom',
                  fontSize: SIZE.xs,
                  marginTop: 2.5,
                }}>
                <Icon
                  name="alert-circle-outline"
                  size={SIZE.xs}
                  color={colors.errorText}
                />{' '}
                Password is invalid
              </Text>
            ) : null}

            <Seperator />

            {login ? null : (
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
                  style={{
                    paddingHorizontal: pv,
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
                  <Text
                    style={{
                      textAlign: 'right',
                      fontFamily: WEIGHT.regular,
                      textAlignVertical: 'bottom',
                      fontSize: SIZE.xs,
                      marginTop: 2.5,
                    }}>
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />{' '}
                    Passwords do not match
                  </Text>
                ) : null}
              </>
            )}

            {login ? null : (
              <>
                <Seperator />
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

                  <Text
                    style={{
                      fontSize: SIZE.sm,
                      fontFamily: WEIGHT.regular,
                      color: colors.pri,
                      maxWidth: '90%',
                      marginLeft: 10,
                    }}>
                    By signing up you agree to our{' '}
                    <Text
                      style={{
                        color: colors.accent,
                      }}>
                      terms of service{' '}
                    </Text>
                    and{' '}
                    <Text
                      style={{
                        color: colors.accent,
                      }}>
                      privacy policy.
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {login ? null : <Seperator />}

            <View
              style={{
                width: '100%',
              }}>
              <Button
                title={  login ? 'Login' : 'Create Account'}
                onPress={login ? loginUser : signupUser}
                width="100%"
                type="accent"
                loading={loggingIn || signingIn}
                fontSize={SIZE.md}
                height={50}
              />
            </View>

            {/*   <TouchableOpacity
              onPress={() => {
                setLogin(!login);
              }}
              activeOpacity={opacity}
              style={{
                alignSelf: 'center',
                marginTop: DDS.isTab ? 35 : 70,
                height: DDS.isTab ? null : 50,
              }}>
              <Text
                style={{
                  fontSize: SIZE.xs + 1,
                  fontFamily: WEIGHT.regular,
                  color: colors.pri,
                  height: 25,
                }}>
                {!login
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <Text
                  style={{
                    color: colors.accent,
                  }}>
                  {!login ? 'Login' : 'Sign up now'}
                </Text>
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LoginDialog;
