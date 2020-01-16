import React, {useState, useEffect} from 'react';

import {
  DeviceEventEmitter,
  Text,
  TouchableNativeFeedback,
  View,
  TouchableOpacity,
} from 'react-native';
import {COLOR_SCHEME, SIZE, opacity, WEIGHT, pv, ph} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import * as Animatable from 'react-native-animatable';
import {h, w} from '../../utils/utils';
import {useAppContext} from '../../provider/useAppContext';
import {useTracked} from '../../provider';

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

  useEffect(() => {
    DeviceEventEmitter.addListener('showToast', data => {
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
    });
    DeviceEventEmitter.addListener('hideToast', data => {
      setToast(false);
    });

    return () => {
      DeviceEventEmitter.removeListener('showToast', data => {
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
      });

      DeviceEventEmitter.removeListener('hideToast', data => {
        setToast(false);
      });
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
        width: '90%',
        marginHorizontal: w * 0.05,

        position: 'absolute',
        bottom: h * 0.025,
        fontFamily: WEIGHT.regular,
        fontSize: SIZE.md,
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
          fontSize: SIZE.md,
        }}>
        {message}
      </Text>

      <TouchableOpacity activeOpacity={1}>
        <Text
          style={{
            ...toastStyle,
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.md,
          }}>
          {data.actionText}
        </Text>
      </TouchableOpacity>
    </AnimatedTouchableOpacity>
  );
};
