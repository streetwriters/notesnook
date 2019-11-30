import React, {useEffect, useState, createRef} from 'react';
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

export const ForgotPassword = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  useEffect(() => {
    DeviceEventEmitter.emit('hide');
    return () => {
      DeviceEventEmitter.emit('show');
    };
  }, []);

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillFocus={() => {
          DeviceEventEmitter.emit('hide');
        }}
      />

      <Header colors={colors} heading={'Recover Password'} />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}>
        {renderForgotPassword(colors)}
      </View>
    </SafeAreaView>
  );
};

ForgotPassword.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default ForgotPassword;

const renderForgotPassword = colors => {
  const _email = createRef();
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
                borderColor: '#f0f0f0',
              },
            });
          }}
          style={{
            padding: pv,
            borderWidth: 1.5,
            borderColor: '#f0f0f0',
            marginHorizontal: '5%',
            borderRadius: 5,
            fontSize: SIZE.md,
            fontFamily: WEIGHT.regular,
            marginBottom: 20,
          }}
          placeholder="Email"
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
            Recover
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
