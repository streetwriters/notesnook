import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { PressableButton } from '../PressableButton';
import { SIZE } from '../../utils/SizeUtils';
import { hexToRGBA, RGB_Linear_Shade } from '../../utils/ColorUtils';
import { showTooltip } from '../../utils';

export const ActionIcon = ({
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
  testID,
  disabled,
  onLongPress,
  tooltipText,
  type = 'gray'
}) => {
  const [state, dispatch] = useTracked();
  const { colors } = state;

  return (
    <PressableButton
      testID={testID}
      onPress={onPress}
      hitSlop={{ top: top, left: left, right: right, bottom: bottom }}
      onLongPress={event => {
        if (onLongPress) {
          onLongPress();
          return;
        }
        if (tooltipText) {
          showTooltip(event, tooltipText);
        }
      }}
      disabled={disabled}
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
      <Icon
        name={name}
        style={iconStyle}
        color={disabled ? RGB_Linear_Shade(-0.05, hexToRGBA(colors.nav)) : color}
        size={size}
      />
    </PressableButton>
  );
};
