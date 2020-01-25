import React, {createRef, useEffect} from 'react';
import {
  DeviceEventEmitter,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {NavigationEvents} from 'react-navigation';
import {DDS} from '../../../App';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {_recieveEvent, _unSubscribeEvent} from '../../components/DialogManager';
import {useIsFocused} from 'react-navigation-hooks';
import {eLoginDialogNavigateBack} from '../../services/events';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';

export const ForgotPassword = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, isLoginNavigator} = state;

  let isFocused = useIsFocused();

  useEffect(() => {
    DeviceEventEmitter.emit('hide');
    return () => {
      DeviceEventEmitter.emit('show');
    };
  }, []);

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
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <NavigationEvents
        onWillFocus={() => {
          DeviceEventEmitter.emit('hide');
        }}
      />

      <Header
        isLoginNavigator={isLoginNavigator}
        colors={colors}
        navigation={navigation}
        heading={'Recover Password'}
      />

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
