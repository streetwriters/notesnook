import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import { useTracked } from '../../provider';
import { BUTTON_TYPES } from '../../utils';
import { hexToRGBA, RGB_Linear_Shade } from '../../utils/ColorUtils';
import { br } from '../../utils/SizeUtils';

/**
 *
 * @typedef {Object} buttonTypes
 * @property {"transparent" | "gray" | "grayBg" | "accent" | "inverted" | "shade" | "grayAccent"} type type of button
 *
 *@param {buttonTypes} type
 *
 */

export const PressableButton = ({
  children,
  onPress,
  customStyle,
  onLongPress,
  hitSlop,
  testID,
  disabled,
  type = 'gray',
  noborder,
  accentColor = 'accent',
  accentText = 'light',
  customColor,
  customSelectedColor,
  customAlpha,
  customOpacity
}) => {
  const [state] = useTracked();
  const { colors } = state;

  const selectedColor =
    customSelectedColor ||
    colors[
      type === 'accent'
        ? BUTTON_TYPES[type](accentColor, accentText).selected
        : BUTTON_TYPES[type].selected
    ];
  const primaryColor =
    customColor ||
    colors[
      type === 'accent'
        ? BUTTON_TYPES[type](accentColor, accentText).primary
        : BUTTON_TYPES[type].primary
    ];
  const opacity = customOpacity
    ? customOpacity
    : type === 'accent'
    ? 1
    : BUTTON_TYPES[type].opacity;
  const alpha = customAlpha ? customAlpha : colors.night ? 0.04 : -0.04;

  const getStyle = useCallback(
    ({ pressed }) => [
      {
        backgroundColor: pressed
          ? RGB_Linear_Shade(alpha, hexToRGBA(selectedColor, opacity || 1))
          : hexToRGBA(primaryColor, opacity || 1 - 0.02),
        width: '100%',
        alignSelf: 'center',
        borderRadius: noborder ? 0 : br,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0
      },
      customStyle
    ],
    [customStyle, noborder, type, colors]
  );

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      style={getStyle}
    >
      {children}
    </Pressable>
  );
};
