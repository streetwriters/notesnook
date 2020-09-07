import React, {useEffect, useState} from 'react';
import {Keyboard, Text, TouchableOpacity} from 'react-native';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {getElevation} from '../../utils/utils';
import {eShowToast, eHideToast} from '../../services/events';
import {eUnSubscribeEvent, eSubscribeEvent} from '../../services/eventManager';
import { useTracked } from '../../provider';

const {spring, timing} = Animated;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(
  TouchableOpacity,
);
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
        backgroundColor: colors.successBg,
        color: colors.successText,
      });
    } else {
      setToastStyle({
        backgroundColor: colors.errorBg,
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

  const hideToastFunc = (data) => {};

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
      <AnimatedTouchableOpacity
        style={{
          ...getElevation(5),
          ...toastStyle,
          maxWidth: '95%',
          minWidth: '50%',
          alignSelf: 'center',
          borderRadius: 5,
          paddingHorizontal: 15,
          paddingVertical: 10,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Text
          style={{
            ...toastStyle,
            backgroundColor: 'transparent',
            fontSize: 16,
            textAlign: 'center',
          }}>
          {data.message}
        </Text>

        <TouchableOpacity activeOpacity={1}>
          <Text
            style={{
              ...toastStyle,
              fontSize: 16,
            }}>
            {data.actionText}
          </Text>
        </TouchableOpacity>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
};
