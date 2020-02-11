import React, {createRef, useEffect, useState} from 'react';
import {
  BackHandler,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS, db} from '../../../App';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/eventManager';
import {eCloseSideMenu} from '../../services/events';
import * as Animatable from 'react-native-animatable';
import {
  validateEmail,
  validatePass,
  validateUsername,
} from '../../services/validation';
import Icon from 'react-native-vector-icons/Feather';
import {ToastEvent} from '../../utils/utils';

export const Login = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;
  const _email = createRef();
  const _pass = createRef();
  const [status, setStatus] = useState('Logging in...');
  const _username = createRef();
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [invalidUsername, setInvalidUsername] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    eSendEvent(eCloseSideMenu);
  }, []);

  const handleBackPress = () => {
    alert('here');
    return true;
  };

  useEffect(() => {
    let backhandler;
    if (isFocused) {
      backhandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress,
      );
    } else {
      if (backhandler) {
        backhandler.remove();
        backhandler = null;
      }
    }

    return () => {
      if (!backhandler) return;
      backhandler.remove();
      backhandler = null;
    };
  }, [isFocused]);

  const _logIn = async () => {
    setLoggingIn(true);
    _username.current.blur();
    _pass.current.blur();

    setTimeout(() => {
      setStatus('Syncing...');

      setTimeout(() => {
        navigation.navigate('Home');

        ToastEvent.show(`Logged in as ${'ammarahmed'}`, 'success');
      }, 500);
    }, 300);

    return;
    if (!invalidPassword && !invalidUsername) {
      try {
        await db.user.login(username, password);
      } catch (e) {
        console.log(e, 'signup');
      }

      let user;

      try {
        user = await db.user.user.get();
        dispatch({type: ACTIONS.USER, user: user});
      } catch (e) {
        console.log('e', 'getUSer');
      }

      console.log(user);
    } else {
      ToastEvent.show('Login failed', 'error');
    }
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      {loggingIn ? (
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

      {loggingIn ? null : (
        <>
          <Header
            navigation={navigation}
            isLoginNavigator={isLoginNavigator}
            colors={colors}
            heading="Login"
          />

          <View
            style={{
              justifyContent: 'flex-start',
              alignItems: 'center',
              width: '100%',
            }}>
            <View
              style={{
                justifyContent: DDS.isTab ? 'center' : 'space-between',
                width: DDS.isTab ? '80%' : '100%',
                height: DDS.isTab ? '80%' : null,

                alignSelf: 'center',
              }}>
              <View
                style={{
                  height: '70%',
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
                  {invalidUsername ? (
                    <Icon
                      name="alert-circle"
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
                    if (!validateUsername(username)) {
                      setInvalidUsername(true);
                      _username.current.setNativeProps({
                        style: {
                          color: colors.errorText,
                          borderColor: colors.errorText,
                        },
                      });
                    } else {
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

                {/* <Text
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
                    <Icon name="alert-circle" size={SIZE.xs} color={colors.errorText} />
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
                    if (!validateEmail(email)) {
                      setInvalidEmail(true);
                      _email.current.setNativeProps({
                        style: {
                          color: colors.errorText,
                          borderColor: colors.errorText,
                        },
                      });
                    } else {
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
                /> */}

                <View
                  style={{
                    marginBottom: 15,
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
                    {invalidPassword ? (
                      <Icon
                        name="alert-circle"
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
                      if (!validatePass(password)) {
                        setInvalidPassword(true);
                        _pass.current.setNativeProps({
                          style: {
                            color: colors.errorText,
                            borderColor: colors.errorText,
                          },
                        });
                      } else {
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
                  {/* <View
                    style={{
                      paddingHorizontal: 12,
                      alignItems: 'flex-end',
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('ForgotPassword');
                      }}
                      activeOpacity={opacity}
                      style={{}}>
                      <Text
                        style={{
                          fontSize: SIZE.xs,
                          fontFamily: WEIGHT.regular,
                          color: colors.accent,
                          height: 25,
                        }}>
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  </View> */}
                </View>
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={_logIn}
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
                    Login
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Signup');
                  }}
                  activeOpacity={opacity}
                  style={{}}>
                  <Text
                    style={{
                      fontSize: SIZE.xs + 1,
                      fontFamily: WEIGHT.regular,
                      color: colors.pri,
                      height: 25,
                    }}>
                    Don't have an account yet?{' '}
                    <Text
                      style={{
                        color: colors.accent,
                      }}>
                      Register now
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

Login.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Login;
