/* import {useIsFocused} from '@react-navigation/native';
import React, {createRef, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {TextInput} from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-generator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {Toast} from '../../components/Toast';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eCloseLoginDialog,
  eLoginDialogNavigateBack,
  eOpenSideMenu,
  eSetModalNavigator,
} from '../../services/events';
import {
  validateEmail,
  validatePass,
  validateUsername,
} from '../../services/validation';
import {db, DDS, getElevation, ToastEvent} from '../../utils/utils';
import {Button} from '../../components/Button';
import Seperator from '../../components/Seperator';

const _email = createRef();
const _pass = createRef();
const _username = createRef();
const _passConfirm = createRef();
const _passContainer = createRef();
export const Signup = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;
  const [signingIn, setSigningIn] = useState(false);
  const [status, setStatus] = useState('Creating new user...');
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [username, setUsername] = useState(null);
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [failed, setFailed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState(false);
  const [key, setKey] = useState('');
  const [passwordReEnter, setPasswordReEnter] = useState(null);
  const [secureEntry, setSecureEntry] = useState(true);
  let isFocused = useIsFocused();

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    eSubscribeEvent(eLoginDialogNavigateBack, handleBackPress);
    return () => {
      eUnSubscribeEvent(eLoginDialogNavigateBack, handleBackPress);
      if (route.params.fromHome) {
        eSendEvent(eOpenSideMenu);
      }
    };
  }, [isFocused]);

  const validateInfo = () => {
    if (!password || !email || !username || !passwordReEnter) {
      ToastEvent.show('All fields are required', 'error');
      return false;
    }

    if (!confirmPassword) {
      ToastEvent.show('Passwords do not match', 'error');
      return false;
    }

    if (!invalidEmail && !invalidPassword && !invalidUsername) {
      ToastEvent.show('Signup information is invalid', 'error');
      return false;
    }
  };

  const signup = async () => {
    if (!validateInfo) return;

    setSigningIn(true);
    setStatus('Creating your account...');
    try {
      await db.user.signup(username, email, password);
    } catch (e) {
      setSigningIn(false);
      setFailed(true);
      ToastEvent.show('Signup failed, Network Error', 'error');
      return;
    }

    let user;
    try {
      user = await db.user.user.get();
      setStatus('Logging you in...');
      let k = await db.user.key();
      setKey(k.key);
      setStatus('Setting up crenditials...');
      dispatch({type: ACTIONS.USER, user: user});
      eSendEvent(eStartSyncer);
      setTimeout(() => {
        setModalVisible(true);
      }, 500);
    } catch (e) {
      setSigningIn(false);
      setFailed(true);
      ToastEvent.show('Login Failed, try again', 'error');
    }
  };

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: null,
          menu: false,
          canGoBack: true,
          route: route,
          color: null,
          navigation: navigation,
          ind: !route.params.root,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          visible: false,
          ind: !route.params.root,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_STATE,
        state: {
          noSelectionHeader: false,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });

      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Create Account',
          ind: !route.params.root,
        },
      });

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'signup',
      });

      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          noSearch: true,
          ind: !route.params.root,
        },
      });
      if (!route.params.root) {
        eSendEvent(eSetModalNavigator, true);
      }
    }
  }, [isFocused]);

  return (
    <View
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
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
              paddingHorizontal: DDS.isTab ? '20%' : '0%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.xl,
                color: colors.accent,
                marginBottom: 25,
              }}>
              Hi there!
            </Text>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
                maxWidth: '85%',
                textAlign: 'center',
                color: colors.pri,
              }}>
              All your data is encrypted. This means that we cannot read your
              data or recover your password.{' '}
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
                  color: colors.pri,
                }}>
                {key}
              </Text>
              <Icon color={colors.accent} size={SIZE.lg} name="clipboard" />
            </TouchableOpacity>

            <Text
              style={{
                color: colors.pri,
                fontSize: 10,
                width: '85%',
                maxWidth: '85%',
              }}>
              You can also save your recovery key from app settings on any
              device.
            </Text>

            <TouchableOpacity
              onPress={() => {
                DDS.isTab
                  ? eSendEvent(eCloseLoginDialog)
                  : navigation.navigate('Home');
                setModalVisible(false);
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
        </View>
        <Toast context="local" />
      </Modal>

      {signingIn ? (
        <Animatable.View
          transition="opacity"
          useNativeDriver={true}
          duration={150}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            backgroundColor: colors.bg,
            opacity: 1,
            position: 'absolute',
          }}>
          <ActivityIndicator color={colors.accent} size={SIZE.xxxl} />

          <Text
            style={{
              color: colors.accent,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.md,
              marginTop: 10,
            }}>
            {status}
          </Text>
        </Animatable.View>
      ) : null}

      {signingIn ? null : (
        <>
          <View
            style={{
              marginTop: Platform.OS == 'ios' ? 125 - 60 : 125 - 60,
            }}
          />

          <View
            style={{
              justifyContent: DDS.isTab ? 'center' : 'flex-start',
              width: DDS.isTab ? '80%' : '100%',
              height: DDS.isTab ? '80%' : '100%',
              alignSelf: 'center',
              paddingHorizontal: 12,
            }}>
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
                padding: pv,
                borderWidth: 1.5,
                borderColor: colors.nav,
                borderRadius: 5,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
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

            <Seperator />

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
                padding: pv,
                borderWidth: 1.5,
                borderColor: colors.nav,
                borderRadius: 5,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
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
                Password is invalid
              </Text>
            ) : null}

            <Seperator />

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
                  paddingVertical: pv,
                  paddingHorizontal: 0,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                  width: '85%',
                  maxWidth: '85%',
                }}
                secureTextEntry={secureEntry}
                placeholder="Password"
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
            <TextInput
              ref={_passConfirm}
              editable={password && !invalidPassword ? true : false}
              defaultValue={passwordReEnter}
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
                padding: pv,
                borderWidth: 1.5,
                borderColor: colors.nav,
                borderRadius: 5,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
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

            <Seperator />

            <Button title="Signup" onPress={signup} width="100%" />

            <TouchableOpacity
              onPress={() => {
                Linking.openURL('https://notesnook.com/privacy.html');
              }}
              activeOpacity={opacity}
              style={{
                alignSelf: 'center',
                marginTop: 70,
              }}>
              <Text
                style={{
                  fontSize: SIZE.xs + 1,
                  fontFamily: WEIGHT.regular,
                  color: colors.pri,
                  height: 25,
                }}>
                By signing up you agree to our{' '}
                <Text
                  style={{
                    color: colors.accent,
                  }}>
                  privacy policy
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default Signup;
 */