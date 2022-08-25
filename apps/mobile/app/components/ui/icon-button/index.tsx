import React from 'react';
import { ColorValue, GestureResponderEvent, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FlipInEasyX,
  FlipInEasyY,
  FlipOutEasyY,
  Layout
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../../stores/use-theme-store';
import { showTooltip, TOOLTIP_POSITIONS } from '../../../utils';
import { hexToRGBA, RGB_Linear_Shade } from '../../../utils/color-scheme/utils';
import { SIZE } from '../../../utils/size';
import { PressableButton, PressableButtonProps } from '../pressable';

interface IconButtonProps extends PressableButtonProps {
  name: string;
  color?: ColorValue;
  size?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  disabled?: boolean;
  tooltipText?: string;
  tooltipPosition?: number;
  iconStyle?: ViewStyle;
}

const AnimatedIcon = Animated.createAnimatedComponent(Icon);
export const IconButton = ({
  onPress,
  name,
  color,
  customStyle,
  size = SIZE.xxl,
  iconStyle = {},
  left = 10,
  right = 10,
  top = 30,
  bottom = 10,
  onLongPress,
  tooltipText,
  type = 'gray',
  fwdRef,
  tooltipPosition = TOOLTIP_POSITIONS.TOP,
  ...restProps
}: IconButtonProps) => {
  const colors = useThemeStore(state => state.colors);

  const _onLongPress = (event: GestureResponderEvent) => {
    if (onLongPress) {
      onLongPress(event);
      return;
    }
    if (tooltipText) {
      showTooltip(event, tooltipText, tooltipPosition);
    }
  };

  return (
    <PressableButton
      {...restProps}
      fwdRef={fwdRef}
      onPress={onPress}
      hitSlop={{ top: top, left: left, right: right, bottom: bottom }}
      onLongPress={_onLongPress}
      type={type}
      customStyle={{
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        ...customStyle
      }}
    >
      <AnimatedIcon
        layout={Layout}
        name={name}
        style={iconStyle}
        color={
          restProps.disabled
            ? RGB_Linear_Shade(-0.05, hexToRGBA(colors.nav))
            : //@ts-ignore
              colors[color] || color
        }
        size={size}
      />
    </PressableButton>
  );
};
