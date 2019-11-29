import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {getElevation} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {NavigationEvents} from 'react-navigation';
import {Header} from '../../components/header';

export const Login = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

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
    <SafeAreaView>
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
  return (
    <View
      style={{
        justifyContent: Platform.isPad ? 'center' : 'space-between',
        height: '80%',
        width: Platform.isPad ? '60%' : '100%',
        alignSelf: 'center',
      }}>
      <View>
        <TextInput
          style={{
            padding: pv,
            backgroundColor: colors.navbg,
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
          style={{
            padding: pv,
            backgroundColor: colors.navbg,
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
          position: Platform.isPad ? 'absolute' : 'relative',
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
