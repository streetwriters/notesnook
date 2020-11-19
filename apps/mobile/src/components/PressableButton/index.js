import React from 'react';
import {Pressable} from 'react-native';
import {hexToRGBA, RGB_Linear_Shade} from "../../utils/ColorUtils";
import {br} from "../../utils/SizeUtils";

export const PressableButton = ({
  color,
  selectedColor,
  borderless,
  radius,
  children,
  onPress,
  customStyle,
  alpha = -0.1,
  opacity = 1,
  onLongPress,
  hitSlop,
  testID,
  disabled
}) => {
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      hitSlop={hitSlop}
      activeOpacity={opacity}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({pressed}) => [
        {
          backgroundColor: pressed
            ? RGB_Linear_Shade(alpha, hexToRGBA(selectedColor, opacity))
            : color !== 'transparent'
            ? hexToRGBA(color, opacity - 0.02)
            : color,
          width: '100%',
          alignSelf: 'center',
          borderRadius: br,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 0,
        },
        customStyle,
      ]}>
      {children}
    </Pressable>
  );
};
