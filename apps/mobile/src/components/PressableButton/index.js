import React, { useState } from 'react';
import {Platform, Pressable} from 'react-native';
import {br, opacity} from '../../common/common';
import { RGB_Linear_Shade, hexToRGBA } from '../../utils/utils';

export const PressableButton = ({
  color,
  selectedColor,
  borderless,
  radius,
  children,
  onPress,
  customStyle,alpha=-0.1,
  opacity=1
}) => {


  return (
    <Pressable
      activeOpacity={opacity}
      onPress={onPress}
      style={({pressed}) => [
        {
          backgroundColor:
            pressed && Platform.OS === 'ios' ? RGB_Linear_Shade(alpha, hexToRGBA(selectedColor, opacity)) : color,
          width: '100%',
          alignSelf: 'center',
          borderRadius: br,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 0,
        },customStyle
      ]}>
      {children}
    </Pressable>
  );
};
