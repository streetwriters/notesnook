import { useIsFocused } from '@react-navigation/native';
import React, { createRef, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TextInput } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { opacity, pv, SIZE, WEIGHT } from '../../common/common';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import { eSendEvent } from '../../services/eventManager';
import { eCloseSideMenu, eOpenSideMenu, eSetModalNavigator, eStartSyncer, refreshNotesPage } from '../../services/events';
import { validatePass, validateUsername } from '../../services/validation';
import { db, DDS, getElevation, ToastEvent } from '../../utils/utils';

export const Login = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;
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
  const _email = createRef();
  const _pass = createRef();
  const _passContainer = createRef();

  const isFocused = useIsFocused();

  const handleBackPress = () => {
    return true;
  };

  useEffect(() => {
    eSendEvent(eCloseSideMenu);
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
      eSendEvent(eOpenSideMenu);
      if (!backhandler) return;
      backhandler.remove();
      backhandler = null;
    };
  }, [isFocused]);

  const _logIn = async () => {
    if (
      !password ||
      password.length < 8 ||
      !username ||
      invalidPassword ||
      invalidUsername
    ) {
      ToastEvent.show('username or password invalid', 'error');
      return;
    }

    setLoggingIn(true);
    _username.current.blur();
    _pass.current.blur();
    setStatus('Logging in...');


    try {
      let res = await db.user.login(username.toLowerCase(), password);
      console.log(res,username,password);
      if (res) {
    
        setStatus('Fetching data...');
      }
    } catch (e) {
      setTimeout(() => {
        ToastEvent.show(e.message, 'error');
        setLoggingIn(false);
      }, 500);

      return;
    }

    let user;

    try {
      user = await db.user.get();
      if (!user) throw new Error('Username or password incorrect');
      dispatch({type: ACTIONS.USER, user: user});
      dispatch({type: ACTIONS.SYNCING, syncing: true});
      setStatus('Syncing your notes...');
      await db.sync();
      eSendEvent(eStartSyncer);
      navigation.goBack();
      dispatch({type: ACTIONS.ALL});
      eSendEvent(refreshNotesPage);
      dispatch({type: ACTIONS.SYNCING, syncing: false});
      ToastEvent.show(`Logged in as ${username}`, 'success');
    } catch (e) {
      dispatch({type: ACTIONS.SYNCING, syncing: false});
      setLoggingIn(false);
      ToastEvent.show(e.message, 'error');
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
          noSelectionHeader: true,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });

      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Login',
          ind: !route.params.root,
        },
      });

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'login',
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
          <View
            style={{
              marginTop: Platform.OS == 'ios' ? 125 - 60 : 125 - 60,
            }}
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
                  placeholder="Username"
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

                  <View
                    ref={_passContainer}
                    style={{
                      borderWidth: 1.5,
                      borderColor: colors.nav,
                      borderRadius: 5,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      marginHorizontal: 12,
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
                      onChangeText={value => {
                        setPassword(value);
                        if (invalidPassword && validatePass(password)) {
                          setInvalidPassword(false);
                          _pass.current.setNativeProps({
                            style: {
                              color: colors.pri,
                            },
                          });
                          _passContainer.current.setNativeProps({
                            style: {
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
                </View>
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={_logIn}
                  style={{
                    ...getElevation(5),
                    padding: pv + 2,
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
                    navigation.navigate('Signup',{
                      root:true
                    });
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
                      Sign Up
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

export default Login;
