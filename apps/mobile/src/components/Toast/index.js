import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {opacity, ph, SIZE, WEIGHT, normalize, pv} from '../../common/common';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eHideToast, eShowToast} from '../../services/events';
import {h, w} from '../../utils/utils';
import Icon from 'react-native-vector-icons/Feather';
import {DDS} from '../../../App';

const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);
export const Toast = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const [toast, setToast] = useState(false);
  const [message, setMessage] = useState([]);
  const [data, setData] = useState([]);
  const [toastStyle, setToastStyle] = useState({
    backgroundColor: colors.errorBg,
    color: colors.errorText,
  });

  const showToastFunc = data => {
    setData(data);
    setToast(true);
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

  hideToastFunc = data => {
    setToast(false);
  };

  useEffect(() => {
    eSubscribeEvent(eShowToast, showToastFunc);
    eSubscribeEvent(eHideToast, hideToastFunc);

    return () => {
      eUnSubscribeEvent('showToast', showToastFunc);

      eUnSubscribeEvent('hideToast', hideToastFunc);
    };
  }, []);

  return (
    <AnimatedTouchableOpacity
      activeOpacity={opacity + 0.1}
      onPress={() => {
        alert('hello');
      }}
      transition="translateY"
      duration={250}
      useNativeDriver={true}
      pointerEvents="box-only"
      style={{
        ...toastStyle,
        height: 60,
        width: DDS.isTab ? normalize(350) : w - 24,
        marginHorizontal: 12,
        position: 'absolute',
        bottom: 15,
        zIndex: 999,
        borderRadius: 5,
        paddingHorizontal: ph + 5,
        justifyContent: 'space-between',
        elevation: 25,
        flexDirection: 'row',
        alignItems: 'center',
        transform: [
          {
            translateY: toast ? 0 : 150,
          },
        ],
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
              ? 'alert-circle'
              : 'check-circle'
          }
          color={toastStyle.color}
          size={SIZE.sm}
        />
        {'  '}
        Email address is invalid
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
  );
};
