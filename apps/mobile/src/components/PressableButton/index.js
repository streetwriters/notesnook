import React from 'react';
import {Platform, Pressable} from 'react-native';
import {br, opacity} from '../../common/common';

export const PressableButton = ({
  color,
  selectedColor,
  borderless,
  radius,
  children,
  onPress,
  customStyle
}) => {
  return (
    <Pressable
      activeOpacity={opacity}
      android_ripple={{
        radius: radius,
        color: selectedColor,
        borderless: borderless,
      }}
      onPress={onPress}
      style={({pressed}) => [
        {
          backgroundColor:
            pressed && Platform.OS === 'ios' ? selectedColor : color,
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
