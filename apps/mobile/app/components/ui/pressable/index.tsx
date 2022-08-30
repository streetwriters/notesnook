import React, { RefObject, useCallback } from "react";
import {
  ColorValue,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  View,
  ViewStyle
} from "react-native";
import Animated from "react-native-reanimated";
import {
  ColorKey,
  ThemeStore,
  useThemeStore
} from "../../../stores/use-theme-store";
import { hexToRGBA, RGB_Linear_Shade } from "../../../utils/color-scheme/utils";
import { BUTTON_TYPES } from "../../../utils/constants";
import { br } from "../../../utils/size";
export interface PressableButtonProps extends PressableProps {
  customStyle?: ViewStyle;
  noborder?: boolean;
  type?: keyof typeof BUTTON_TYPES;
  accentColor?: keyof ThemeStore["colors"];
  accentText?: keyof ThemeStore["colors"];
  customColor?: ColorValue;
  customSelectedColor?: ColorValue;
  customAlpha?: number;
  customOpacity?: number;
  fwdRef?: RefObject<View>;
  animatedViewProps?: Animated.AnimateProps<View>;
}

export const PressableButton = ({
  children,
  onPress,
  customStyle = {},
  onLongPress,
  hitSlop,
  testID,
  disabled,
  type = "gray",
  noborder,
  accentColor = "accent",
  accentText = "light",
  customColor,
  customSelectedColor,
  customAlpha,
  customOpacity,
  fwdRef
}: PressableButtonProps) => {
  const colors = useThemeStore((state) => state.colors);

  const selectedColor =
    customSelectedColor ||
    colors[
      type === "accent"
        ? (BUTTON_TYPES[type](accentColor, accentText).selected as ColorKey)
        : (BUTTON_TYPES[type].selected as ColorKey)
    ];
  const primaryColor =
    customColor ||
    colors[
      type === "accent"
        ? (BUTTON_TYPES[type](accentColor, accentText).primary as ColorKey)
        : (BUTTON_TYPES[type].primary as ColorKey)
    ];
  const opacity = customOpacity
    ? customOpacity
    : type === "accent"
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
        width: "100%",
        alignSelf: "center",
        borderRadius: noborder ? 0 : br,
        justifyContent: "center",
        alignItems: "center",
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
