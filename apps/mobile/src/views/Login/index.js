import React, {createRef, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {TextInput} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useIsFocused} from 'react-navigation-hooks';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eCloseSideMenu, refreshNotesPage} from '../../services/events';
import {validatePass, validateUsername} from '../../services/validation';
import {db, DDS, ToastEvent} from '../../utils/utils';

export const Login = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;
  const _email = createRef();
  const _pass = createRef();
  const [status, setStatus] = useState('Logging in...');
  const _username = createRef();
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [username, setUsername] = useState(null);
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  const isFocused = useIsFocused();

  useEffect(() => {
    eSendEvent(eCloseSideMenu);
  }, []);

  const handleBackPress = () => {
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
    if (!password || password.length < 8) {
      ToastEvent.show('Invalid username or password', 'error');
      return;
    }
    if (!username) {
      ToastEvent.show('Invalid username or password', 'error');
      return;
    }
    setLoggingIn(true);
    _username.current.blur();
    _pass.current.blur();

    setStatus('Logging in...');

    if (!invalidPassword && !invalidUsername) {
      try {
        console.log('here reacched');
        await db.user.login(username, password);
      } catch (e) {
        console.log(e, 'ERROR');
        setTimeout(() => {
          ToastEvent.show(e.message, 'error');
          setLoggingIn(false);
        }, 500);

        return;
      }

      let user;
      try {
        user = await db.user.get();
        console.log('user', user);
        dispatch({type: ACTIONS.USER, user: user});
        ToastEvent.show(`Logged in as ${username}`, 'success');
        navigation.goBack();
        await db.sync();
        eSendEvent(refreshNotesPage);
        dispatch({type: ACTIONS.ALL});
      } catch (e) {
        console.log(e, 'getUSer');
        ToastEvent.show(e.message, 'error');
      }

      console.log(user);
    } else {
      ToastEvent.show('Login failed', 'error');
    }
  };

  return (
    <View
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
                    justifyContent: 'center',
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
                  <Icon
                    name="eye"
                    size={20}
                    onPress={() => {
                      setSecureEntry(!secureEntry);
                    }}
                    style={{
                      position: 'absolute',
                      right: 30,
                      zIndex: 10,
                    }}
                    color={secureEntry ? colors.icon : colors.accent}
                  />
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
                      if (!validatePass(password) && password?.length > 0) {
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
                      paddingRight:24,
                      borderRadius: 5,
                      fontSize: SIZE.sm,
                      fontFamily: WEIGHT.regular,
                    }}
                    secureTextEntry={secureEntry}
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
    </View>
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
