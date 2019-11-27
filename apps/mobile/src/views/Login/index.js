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

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Login = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  useEffect(() => {
    DeviceEventEmitter.emit('hide');
    return () => {
      DeviceEventEmitter.emit('show');
    };
  });

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillFocus={() => {
          DeviceEventEmitter.emit('hide');
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
          marginBottom: h * 0.04,
        }}>
        <Text
          style={{
            fontSize: SIZE.xxl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          Log in
        </Text>
      </View>

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
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: 'white',
            }}>
            Log in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
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
          height: h * 0.25,
          position: 'absolute',
          top: h * 0.75,
          justifyContent: 'center',
          width: '100%',
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
          activeOpacity={opacity}
          style={{
            alignItems: 'center',
            width: '100%',
          }}>
          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.accent,
            }}>
            Create a New Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

Login.navigationOptions = {
  header: null,
};

export default Login;
