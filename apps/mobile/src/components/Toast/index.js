import React, {useEffect, useState} from 'react';
import {Keyboard, Text, TouchableOpacity, View} from 'react-native';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {getElevation} from '../../utils/utils';
import {eShowToast, eHideToast} from '../../services/events';
import {eUnSubscribeEvent, eSubscribeEvent} from '../../services/eventManager';
import {useTracked} from '../../provider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE} from '../../common/common';
const {spring, timing} = Animated;

export const Toast = ({context = 'global'}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [keyboard, setKeyboard] = useState(false);
  const [data, setData] = useState([]);
  const [toastStyle, setToastStyle] = useState({
    backgroundColor: colors.errorBg,
    color: colors.errorText,
  });

  let toastTranslate = useValue(300);

  const showToastFunc = (data) => {
    setData(data);
    if (data.type === 'success') {
      setToastStyle({
        color: colors.successText,
      });
    } else {
      setToastStyle({
        color: colors.errorText,
      });
    }

    setTimeout(() => {
      timing(toastTranslate, {
        toValue: 0,
        duration: 500,
        easing: Easing.elastic(1.1),
      }).start();
    }, 100);

    setTimeout(() => {
      timing(toastTranslate, {
        toValue: 300,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      }).start();
    }, data.duration);
  };

  const hideToastFunc = (data) => {
    timing(toastTranslate, {
      toValue: 300,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    }).start();
  };

  const _onKeyboardShow = () => {
    setKeyboard(true);
  };

  const _onKeyboardHide = () => {
    setKeyboard(false);
  };

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', _onKeyboardShow);
    Keyboard.addListener('keyboardDidHide', _onKeyboardHide);
    eSubscribeEvent(eShowToast, showToastFunc);
    eSubscribeEvent(eHideToast, hideToastFunc);

    return () => {
      Keyboard.removeListener('keyboardDidShow', _onKeyboardShow);
      Keyboard.removeListener('keyboardDidHide', _onKeyboardHide);
      eUnSubscribeEvent('showToast', showToastFunc);

      eUnSubscribeEvent('hideToast', hideToastFunc);
    };
  }, []);

  return (
    <Animated.View
      style={{
        width: '100%',
        alignItems: 'center',
        height: 60,
        bottom: keyboard ? 30 : 100,
        position: 'absolute',
        zIndex: 999,
        elevation: 15,
        transform: [
          {
            translateY: toastTranslate,
          },
        ],
      }}>
      <Animated.View
        activeOpacity={0.8}
        style={{
          ...getElevation(5),
          ...toastStyle,
          maxWidth: '95%',
          backgroundColor: 'black',
          minWidth: data.func ? '95%' : '50%',
          alignSelf: 'center',
          borderRadius: 5,
          height: 50,
          paddingHorizontal: 15,
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            maxWidth: data.func ? '90%' : '75%',
          }}>
          <View
            style={{
              width: 25,
              height: 25,
              backgroundColor:
                data.type === 'error' ? colors.errorText : colors.successText,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
            }}>
            <Icon
              name={data.type === 'success' ? 'check' : 'close'}
              size={20}
              color="white"
            />
          </View>

          <Text
            style={{
              color: 'white',
              backgroundColor: 'transparent',
              fontSize: SIZE.sm,
            }}>
            {data.message}
          </Text>
        </View>

        {data.func ? (
          <TouchableOpacity
            onPress={data.func}
            style={{
              width: '15%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 5,
            }}
            activeOpacity={0.5}>
            <Text
              style={{
                fontSize: SIZE.sm,
                color:
                  data.type === 'error' ? colors.errorText : colors.successText,
              }}>
              {data.actionText}
            </Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
};
