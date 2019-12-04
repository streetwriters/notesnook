import React, {useState, useEffect} from 'react';

import {DeviceEventEmitter, Text} from 'react-native';
import {COLOR_SCHEME, SIZE, opacity, WEIGHT, pv, ph} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import * as Animatable from 'react-native-animatable';
import {h} from '../../utils/utils';

export const Toast = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [toast, setToast] = useState(false);
  const [toastStyle, setToastStyle] = useState({
    backgroundColor: colors.errorBg,
    color: colors.errorText,
  });

  useEffect(() => {
    DeviceEventEmitter.addListener('showToast', data => {
      setToast(true);

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
      }, data.duration || 1000);
    });
    DeviceEventEmitter.addListener('hideToast', data => {
      setToast(false);
    });

    return () => {
      DeviceEventEmitter.removeListener('showToast', data => {
        setToast(true);
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
        }, data.duration || 1000);
      });

      DeviceEventEmitter.removeListener('hideToast', data => {
        setToast(false);
      });
    };
  }, []);

  return (
    <Animatable.View
      transition="translateY"
      duration={250}
      useNativeDriver={true}
      style={{
        ...toastStyle,
        height: 55,
        width: '90%',
        marginHorizontal: '5%',
        marginBottom: h * 0.025,
        position: 'absolute',
        bottom: 0,
        fontFamily: WEIGHT.regular,
        fontSize: SIZE.md,
        zIndex: 999,
        borderRadius: 5,
        paddingHorizontal: ph,
        justifyContent: 'center',
        elevation: 10,
        transform: [
          {
            translateY: toast ? 0 : 150,
          },
        ],
      }}>
      <Text>Hello</Text>
    </Animatable.View>
  );
};
