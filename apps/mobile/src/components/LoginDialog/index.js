import CheckBox from '@react-native-community/checkbox';
import React, {createRef, useEffect, useState} from 'react';
import {Clipboard, Modal, Text, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-generator';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {Button} from '../../components/Button';
import Seperator from '../../components/Seperator';
import {Toast} from '../../components/Toast';
import {ACTIONS} from '../../provider/actions';
import {useTracked} from '../../provider/index';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eCloseLoginDialog,
  eOpenLoginDialog,
  eStartSyncer,
  refreshNotesPage,
} from '../../services/events';
import {
  validateEmail,
  validatePass,
  validateUsername,
} from '../../services/validation';
import {db, DDS, getElevation, ToastEvent} from '../../utils/utils';
import {Loading} from '../Loading';

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
  const [modalVisible, setModalVisible] = useState(false);
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
    setModalVisible(false);
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
      if (!user) throw new Error('Username or password incorrect');
      setStatus('Syncing your notes');
      dispatch({type: ACTIONS.USER, user: user});
      dispatch({type: ACTIONS.SYNCING, syncing: true});
      await db.sync();
      eSendEvent(eStartSyncer);
      dispatch({type: ACTIONS.ALL});
      eSendEvent(refreshNotesPage);
      setVisible(false);
      ToastEvent.show(`Logged in as ${username}`, 'success', 'local');
    } catch (e) {
      ToastEvent.show(e.message, 'error', 'local');
    } finally {
      dispatch({type: ACTIONS.SYNCING, syncing: false});
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

    if (!invalidEmail && !invalidPassword && !invalidUsername) {
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
  };

  const signupUser = async () => {
    if (!validateInfo) return;

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
      let k = await db.user.key();
      setKey(k.key);
      setStatus('Setting up crenditials');
      dispatch({type: ACTIONS.USER, user: user});
      eSendEvent(eStartSyncer);
      setModalVisible(true);
    } catch (e) {
      setSigningIn(false);
      setFailed(true);
      ToastEvent.show('Login Failed, try again', 'error', 'local');
    }
  };

  return (
    <Modal
      animated={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={close}
      visible={visible}
      transparent={true}>
      <View
        style={{
          opacity: 1,
          flex: 1,
          paddingTop: insets.top,
          backgroundColor: DDS.isTab ? 'rgba(0,0,0,0.3)' : colors.bg,
          width: '100%',
          height: '100%',
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
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
            height: '100%',
            width: '100%',
            backgroundColor: colors.bg,
            justifyContent: 'center',
          }}>
          <Toast context="local" />
          {loggingIn || signingIn ? (
            modalVisible ? (
              <View
                style={{
                  paddingHorizontal: 12,
                  width: '100%',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily: WEIGHT.bold,
                    fontSize: SIZE.xxxl,
                    color: colors.accent,
                  }}>
                  Data Recovery Key
                </Text>
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.md,
                    color: colors.icon,
                    textAlign: 'center',
                  }}>
                  We cannot recover your data if you forget your password. You
                  can use this recovery key to get your data back if you lose
                  your password.
                </Text>

                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.sm,
                    maxWidth: '85%',
                    marginTop: 25,
                    marginBottom: 10,
                    color: colors.pri,
                  }}>
                  Take a Sceenshot of this screen
                </Text>
                <QRCode
                  value={key}
                  size={200}
                  bgColor="black"
                  fgColor="white"
                />
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
                      color: colors.pri,
                    }}>
                    {key}
                  </Text>
                  <Icon color={colors.accent} size={SIZE.lg} name="clipboard" />
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.pri,
                    fontSize: SIZE.xs,
                    width: '85%',
                    maxWidth: '85%',
                    textAlign: 'center',
                  }}>
                  You can get recovery key in settings on any device later.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    close();
                  }}
                  activeOpacity={opacity}
                  style={{
                    ...getElevation(5),
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
            ) : (
              <Loading tagline={status} />
            )
          ) : (
            <>
              <Icon
                name="arrow-left"
                size={SIZE.xxxl}
                onPress={() => {
                  close();
                }}
                style={{
                  width: 50,
                  height: 50,
                  marginLeft: 12,
                  position: 'absolute',
                  textAlignVertical: 'center',
                  top: 0,
                  marginBottom: 15,
                }}
                color={colors.heading}
              />
              <View
                style={{
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  alignSelf: 'center',
                  paddingHorizontal: 12,
                }}>
                <View
                  style={{
                    marginBottom: 25,
                  }}>
                  <Text
                    style={{
                      color: colors.accent,
                      fontFamily: WEIGHT.bold,
                      fontSize: SIZE.xxxl,
                    }}>
                    {login ? 'Login' : 'Sign up'}
                    {'\n'}
                    <Text
                      style={{
                        color: colors.icon,
                        fontSize: SIZE.md,
                        fontFamily: WEIGHT.regular,
                      }}>
                      {login
                        ? 'Get all your notes from other devices'
                        : 'Create an account to access notes anywhere.'}
                      {}
                    </Text>
                  </Text>
                </View>

                <>
                  <TextInput
                    ref={_username}
                    onFocus={() => {
                      if (!invalidUsername) {
                        _username.current.setNativeProps({
                          style: {
                            borderColor: colors.accent,
                          },
                        });
                      }
                    }}
                    autoCapitalize="none"
                    defaultValue={username}
                    onBlur={() => {
                      if (!validateUsername(username) && username?.length > 0) {
                        setInvalidUsername(true);
                        _username.current.setNativeProps({
                          style: {
                            color: colors.errorText,
                            borderColor: colors.errorText,
                          },
                        });
                      } else {
                        setInvalidUsername(false);
                        _username.current.setNativeProps({
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
                      borderWidth: 1.5,
                      borderColor: colors.nav,
                      borderRadius: 5,
                      fontSize: SIZE.sm,
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
                      autoCapitalize="none"
                      defaultValue={email}
                      onBlur={() => {
                        if (!validateEmail(email) && email?.length > 0) {
                          setInvalidEmail(true);
                          _email.current.setNativeProps({
                            style: {
                              color: colors.errorText,
                              borderColor: colors.errorText,
                            },
                          });
                        } else {
                          setInvalidEmail(false);
                          _email.current.setNativeProps({
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
                        borderWidth: 1.5,
                        borderColor: colors.nav,
                        borderRadius: 5,
                        fontSize: SIZE.sm,
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
                    borderWidth: 1.5,
                    borderColor: colors.nav,
                    paddingHorizontal: 10,
                    borderRadius: 5,
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
                    autoCapitalize="none"
                    defaultValue={password}
                    onBlur={() => {
                      if (!validatePass(password) && password?.length > 0) {
                        setInvalidPassword(true);
                        _pass.current.setNativeProps({
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
                      fontSize: SIZE.sm,
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
                      editable={password && !invalidPassword ? true : false}
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
                        borderWidth: 1.5,
                        height: 50,
                        borderColor: colors.nav,
                        borderRadius: 5,
                        fontSize: SIZE.sm,
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
                  <View
                    style={{
                      flexDirection: 'row',
                      width: '100%',
                    }}>
                    <CheckBox
                      onValueChange={(value) => {
                        setUserConsent(value);
                      }}
                      boxType="circle"
                      tintColors={{true: colors.accent, false: colors.icon}}
                      value={userConsent}
                    />
                    <Text
                      style={{
                        fontSize: SIZE.xs + 1,
                        fontFamily: WEIGHT.regular,
                        color: colors.pri,
                        maxWidth: '90%',
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
                  </View>
                )}
                {login ? null : <Seperator />}

                <View
                  style={{
                    width: '100%',
                  }}>
                  <Button
                    title={login ? 'Login' : 'Create Account'}
                    onPress={login ? loginUser : signupUser}
                    width="100%"
                    height={50}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => {
                    ToastEvent.show('hello world', 'error', 'local');

                    setLogin(!login);
                  }}
                  activeOpacity={opacity}
                  style={{
                    alignSelf: 'center',
                    marginTop: 70,
                    height: 50,
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
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default LoginDialog;
