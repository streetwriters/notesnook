import React, {useEffect, useState, createRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  DeviceEventEmitter,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {SIZE, pv, opacity, WEIGHT} from '../../common/common';

import {TextInput} from 'react-native-gesture-handler';
import {NavigationEvents} from 'react-navigation';
import {Header} from '../../components/header';
import {DDS} from '../../../App';
import {useAppContext} from '../../provider/useAppContext';
export const Login = ({navigation}) => {
  const {colors} = useAppContext();
  useEffect(() => {
    DeviceEventEmitter.emit('hide');
    return () => {
      DeviceEventEmitter.emit('show');
    };
  }, []);

  useEffect(() => {
    DeviceEventEmitter.emit('closeSidebar');
    return () => {
      DeviceEventEmitter.emit('openSidebar');
    };
  }, []);

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <NavigationEvents
        onWillFocus={() => {
          DeviceEventEmitter.emit('hide');
        }}
      />
      <Header colors={colors} heading="Login" />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
        {renderLogin(colors)}
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

const renderLogin = colors => {
  const _email = createRef();
  const _pass = createRef();
  return (
    <View
      style={{
        justifyContent: DDS.isTab ? 'center' : 'space-between',
        height: '80%',
        width: DDS.isTab ? '60%' : '100%',
        alignSelf: 'center',
      }}>
      <View>
        <TextInput
          ref={_email}
          onFocus={() => {
            _email.current.setNativeProps({
              style: {
                borderColor: colors.navbg,
              },
            });
          }}
          onBlur={() => {
            _email.current.setNativeProps({
              style: {
                borderColor: colors.nav,
              },
            });
          }}
          style={{
            padding: pv,
            borderWidth: 1.5,
            borderColor: colors.nav,
            marginHorizontal: '5%',
            borderRadius: 5,
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
            marginBottom: 20,
          }}
          placeholder="Email"
          placeholderTextColor={colors.icon}
        />
        <TextInput
          ref={_pass}
          onFocus={() => {
            _pass.current.setNativeProps({
              style: {
                borderColor: colors.navbg,
              },
            });
          }}
          onBlur={() => {
            _pass.current.setNativeProps({
              style: {
                borderColor: colors.nav,
              },
            });
          }}
          style={{
            padding: pv,
            borderWidth: 1.5,
            borderColor: colors.nav,
            marginHorizontal: '5%',
            borderRadius: 5,
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
            marginBottom: 20,
          }}
          placeholder="Password"
          placeholderTextColor={colors.icon}
        />

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            padding: pv,
            backgroundColor: colors.accent,
            borderRadius: 5,
            marginHorizontal: '5%',
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

        <TouchableOpacity
          onPress={() => {
            NavigationService.navigate('ForgotPassword');
          }}
          activeOpacity={opacity}
          style={{
            alignItems: 'flex-end',
            marginHorizontal: '5%',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.accent,
            }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          width: '100%',
          position: DDS.isTab ? 'absolute' : 'relative',
          bottom: '0%',
        }}>
        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            alignItems: 'center',
            width: '100%',
            marginBottom: 20,
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: colors.accent,
            }}>
            Login with G
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            NavigationService.navigate('Signup');
          }}
          activeOpacity={opacity}
          style={{
            alignItems: 'center',
            width: '100%',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.bold,
              color: colors.accent,
            }}>
            Create a New Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
