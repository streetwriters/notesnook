import React, { RefObject, useCallback } from 'react';
import {
  ColorValue,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  ViewStyle
} from 'react-native';
import { useTracked } from '../../../provider';
import { BUTTON_TYPES } from '../../../utils/constants';
import { hexToRGBA, RGB_Linear_Shade } from '../../../utils/color-scheme/utils';
import { br } from '../../../utils/size';
import { defaultState } from '../../../provider/DefaultState';

export interface PressableButtonProps extends PressableProps {
  customStyle?: ViewStyle;
  noborder?: boolean;
  type?: keyof typeof BUTTON_TYPES;
  accentColor?: keyof typeof defaultState['colors'];
  accentText?: keyof typeof defaultState['colors'];
  customColor?: ColorValue;
  customSelectedColor?: ColorValue;
  customAlpha?: number;
  customOpacity?: number;
  fwdRef?: RefObject<any>;
}

export const PressableButton = ({
  children,
  onPress,
  customStyle = {},
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
  customOpacity,
  fwdRef
}: PressableButtonProps) => {
  const [state] = useTracked();
  const { colors } = state;

  const selectedColor =
    customSelectedColor ||
    //@ts-ignore
    colors[
      type === 'accent'
        ? BUTTON_TYPES[type](accentColor, accentText).selected
        : BUTTON_TYPES[type].selected
    ];
  const primaryColor =
    customColor ||
    //@ts-ignore
    colors[
      type === 'accent'
        ? BUTTON_TYPES[type](accentColor, accentText).primary
        : BUTTON_TYPES[type].primary
    ];
  const opacity = customOpacity
    ? customOpacity
    : type === 'accent'
    ? 1
    : //@ts-ignore
      BUTTON_TYPES[type].opacity;
  const alpha = customAlpha ? customAlpha : colors.night ? 0.04 : -0.04;

  const getStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle | ViewStyle[] => [
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
      ref={fwdRef}
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
