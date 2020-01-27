import React, {createRef, useEffect, useState} from 'react';
import {
  BackHandler,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS} from '../../../App';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/eventManager';
import {eCloseSideMenu} from '../../services/events';
import {validateEmail, validatePass} from '../../services/validation';
import Icon from 'react-native-vector-icons/Feather';

export const Login = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;

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

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <Header
        navigation={navigation}
        isLoginNavigator={isLoginNavigator}
        colors={colors}
        heading="Login"
      />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
        {renderLogin(colors, navigation)}
      </View>
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

const renderLogin = (colors, navigation) => {
  const _email = createRef();
  const _pass = createRef();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);

  return (
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
            height: 25,
            textAlignVertical: 'bottom',
          }}>
          {invalidEmail ? (
            <Icon name="alert-circle" size={SIZE.sm} color={colors.errorText} />
          ) : null}

          {invalidEmail ? ' Email is invalid' : ''}
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
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
          }}
          placeholder="Email"
          placeholderTextColor={colors.icon}
        />

        <Text
          style={{
            textAlign: 'right',
            marginHorizontal: 12,
            fontFamily: WEIGHT.regular,
            height: 25,
            textAlignVertical: 'bottom',
          }}>
          {invalidPassword ? (
            <Icon name="alert-circle" size={SIZE.sm} color={colors.errorText} />
          ) : null}

          {invalidPassword ? ' Password is invalid' : ''}
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
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
            marginBottom: 25,
          }}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor={colors.icon}
        />

        <TouchableOpacity
          activeOpacity={opacity}
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

        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Signup');
            }}
            activeOpacity={opacity}
            style={{}}>
            <Text
              style={{
                fontSize: SIZE.sm - 1,
                fontFamily: WEIGHT.regular,
                color: colors.accent,
              }}>
              Create a New Account
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ForgotPassword');
            }}
            activeOpacity={opacity}
            style={{}}>
            <Text
              style={{
                fontSize: SIZE.sm - 1,
                fontFamily: WEIGHT.regular,
                color: colors.accent,
              }}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
