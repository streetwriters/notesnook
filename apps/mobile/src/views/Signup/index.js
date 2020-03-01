import React, {createRef, useEffect, useState} from 'react';
import {SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS, db} from '../../../App';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eLoginDialogNavigateBack} from '../../services/events';
import * as Animatable from 'react-native-animatable';
const _email = createRef();
const _pass = createRef();
const _username = createRef();

import {
  validateUsername,
  validateEmail,
  validatePass,
} from '../../services/validation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ToastEvent} from '../../utils/utils';
import {ACTIONS} from '../../provider/actions';
export const Signup = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;
  const [signingIn, setSigningIn] = useState(false);
  const [status, setStatus] = useState('Creating new user...');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [failed, setFailed] = useState(false);
  let isFocused = useIsFocused();

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    eSubscribeEvent(eLoginDialogNavigateBack, handleBackPress);
    return () => {
      eUnSubscribeEvent(eLoginDialogNavigateBack, handleBackPress);
    };
  }, [isFocused]);

  const _signUp = async () => {
    setSigningIn(true);
    setStatus('Creating new user...');
    if (!invalidEmail && !invalidPassword && !invalidUsername) {
      try {
        await db.user.signup(username, email, password);
      } catch (e) {
        console.log(e, 'signup');
        setSigningIn(false);
        setFailed(true);
        ToastEvent.show('Signup failed, Network Error', 'error');
        return;
      }

      let user;

      setStatus('Logging you in...');
      try {
        user = await db.user.user.get();
        dispatch({type: ACTIONS.USER, user: user});

        setTimeout(() => {
          navigation.navigate('Home');

          ToastEvent.show(`Logged in as ${'ammarahmed'}`, 'success');
        }, 500);
      } catch (e) {
        console.log('e', 'getUSer');
        setSigningIn(false);
        setFailed(true);
        ToastEvent.show('Login Failed, try again', 'error');
      }

      console.log(user);
    } else {
      ToastEvent.show('Signup failed', 'error');
    }
  };

  return (
    <SafeAreaView
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
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
          <Header
            isLoginNavigator={isLoginNavigator}
            navigation={navigation}
            colors={colors}
            heading="Create Account"
          />

          <View
            style={{
              justifyContent: DDS.isTab ? 'center' : 'flex-start',
              width: DDS.isTab ? '80%' : '100%',
              height: DDS.isTab ? '80%' : '100%',
              alignSelf: 'center',
            }}>
            <View>
              <Text
                style={{
                  textAlign: 'right',
                  marginHorizontal: 12,
                  fontFamily: WEIGHT.regular,

                  textAlignVertical: 'bottom',

                  position: 'absolute',
                  right: 5,
                  top: 2.5,
                }}>
                {invalidUsername ? (
                  <Icon
                    name="alert-circle-outline"
                    size={SIZE.xs}
                    color={colors.errorText}
                  />
                ) : null}
              </Text>

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
                  if (!validateUsername(username) && username.length > 0) {
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
                onChangeText={value => {
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
                  marginHorizontal: 12,
                  borderRadius: 5,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                }}
                placeholder="Username (a-z _- 0-9)"
                placeholderTextColor={colors.icon}
              />

              <View
                style={{
                  marginTop: 15,
                }}>
                <Text
                  style={{
                    textAlign: 'right',
                    marginHorizontal: 12,
                    fontFamily: WEIGHT.regular,

                    textAlignVertical: 'bottom',

                    position: 'absolute',
                    right: 5,
                    top: 2.5,
                  }}>
                  {invalidEmail ? (
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />
                  ) : null}
                </Text>

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
                    if (!validateEmail(email) && email.length > 0) {
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
                  onChangeText={value => {
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
                    marginHorizontal: 12,
                    borderRadius: 5,
                    fontSize: SIZE.sm,
                    fontFamily: WEIGHT.regular,
                  }}
                  placeholder="Email"
                  placeholderTextColor={colors.icon}
                />
              </View>

              <View
                style={{
                  marginTop: 15,
                  marginBottom: 15,
                }}>
                <Text
                  style={{
                    textAlign: 'right',
                    marginHorizontal: 12,
                    fontFamily: WEIGHT.regular,

                    textAlignVertical: 'bottom',
                    position: 'absolute',
                    right: 5,
                    top: 2.5,
                  }}>
                  {invalidPassword ? (
                    <Icon
                      name="alert-circle-outline"
                      size={SIZE.xs}
                      color={colors.errorText}
                    />
                  ) : null}
                </Text>
                <TextInput
                  ref={_pass}
                  onFocus={() => {
                    if (!invalidPassword) {
                      _pass.current.setNativeProps({
                        style: {
                          borderColor: colors.accent,
                        },
                      });
                    }
                  }}
                  defaultValue={password}
                  onBlur={() => {
                    if (!validatePass(password) && password.length > 0) {
                      setInvalidPassword(true);
                      _pass.current.setNativeProps({
                        style: {
                          color: colors.errorText,
                          borderColor: colors.errorText,
                        },
                      });
                    } else {
                      setInvalidPassword(false);
                      _pass.current.setNativeProps({
                        style: {
                          borderColor: colors.nav,
                        },
                      });
                    }
                  }}
                  onChangeText={value => {
                    setPassword(value);

                    if (invalidPassword && validatePass(password)) {
                      setInvalidPassword(false);
                      _pass.current.setNativeProps({
                        style: {
                          color: colors.pri,
                          borderColor: colors.accent,
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
                    padding: pv,
                    borderWidth: 1.5,
                    borderColor: colors.nav,
                    marginHorizontal: 12,
                    borderRadius: 5,
                    fontSize: SIZE.sm,
                    fontFamily: WEIGHT.regular,
                  }}
                  secureTextEntry={true}
                  placeholder="Password"
                  placeholderTextColor={colors.icon}
                />
              </View>
              <TouchableOpacity
                activeOpacity={opacity}
                onPress={_signUp}
                style={{
                  padding: pv,
                  backgroundColor: colors.accent,
                  borderRadius: 5,
                  marginHorizontal: 12,
                  marginBottom: 10,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.medium,
                    color: 'white',
                  }}>
                  Signup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

Signup.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Signup;
