import React, {createRef, useEffect, useState} from 'react';
import {SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS} from '../../../App';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eLoginDialogNavigateBack} from '../../services/events';
import {
  validateUsername,
  validateEmail,
  validatePass,
} from '../../services/validation';
import Icon from 'react-native-vector-icons/Feather';
export const Signup = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;

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

  return (
    <SafeAreaView
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <Header
        isLoginNavigator={isLoginNavigator}
        navigation={navigation}
        colors={colors}
        heading="Create Account"
      />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
        {renderSignup(colors)}
      </View>
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

const renderSignup = colors => {
  const _email = createRef();
  const _pass = createRef();
  const _username = createRef();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [invalidUsername, setInvalidUsername] = useState(false);

  return (
    <View
      style={{
        justifyContent: 'center',
        width: '80%',
        height: '80%',
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
          {invalidUsername ? (
            <Icon name="alert-circle" size={SIZE.sm} color={colors.errorText} />
          ) : null}

          {invalidUsername ? ' Username has invalid characters' : ''}
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
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
          }}
          placeholder="Username (a-z _- 0-9)"
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

          {invalidPassword ? ' Password too short' : ''}
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
            Signup
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
