import React, {useEffect, useState} from 'react';
import {Keyboard, Text, TouchableOpacity} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {normalize, opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eHideToast, eShowToast} from '../../services/events';
import {DDS, w} from '../../utils/utils';

const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);
export const Toast = ({context = 'global'}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [toast, setToast] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [message, setMessage] = useState([]);
  const [data, setData] = useState([]);
  const [toastStyle, setToastStyle] = useState({
    backgroundColor: colors.errorBg,
    color: colors.errorText,
  });

  const showToastFunc = data => {
    setData(data);

    if (data.context === context) {
      setToast(true);
    }
    if (data.message) {
      setMessage(data.message);
    }

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
      setToast(false);
    }, data.duration);
  };

  const hideToastFunc = data => {
    setToast(false);
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
    <Animatable.View
      transition={['translateY', 'opacity']}
      duration={10}
      delay={toast ? 300 : 0}
      useNativeDriver={true}
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
            translateY: toast ? 0 : 300,
          },
        ],
      }}>
      <AnimatedTouchableOpacity
        activeOpacity={opacity + 0.1}
        transition={['opacity']}
        duration={300}
        style={{
          ...toastStyle,
          maxWidth: DDS.isTab ? normalize(350) : w - 24,
          minWidth: DDS.isTab ? normalize(250) : w / 2,
          alignSelf: 'center',
          borderRadius: 5,
          paddingHorizontal: ph,
          paddingVertical: pv,
          opacity: toast ? 1 : 0,
          justifyContent: 'center',
          elevation: 25,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Text
          style={{
            ...toastStyle,
            backgroundColor: 'transparent',
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.sm,
          }}>
          <Icon
            name={
              toastStyle.color === colors.errorText
                ? 'alert-circle-outline'
                : 'check-circle-outline'
            }
            color={toastStyle.color}
            size={SIZE.sm}
          />
          {'  '}
          {message}
        </Text>

        <TouchableOpacity activeOpacity={1}>
          <Text
            style={{
              ...toastStyle,
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.sm,
            }}>
            {data.actionText}
          </Text>
        </TouchableOpacity>
      </AnimatedTouchableOpacity>
    </Animatable.View>
  );
};
