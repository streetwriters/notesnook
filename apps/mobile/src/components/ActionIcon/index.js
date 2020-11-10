import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {PressableButton} from '../PressableButton';
import {SIZE} from '../../utils/SizeUtils';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';

export const ActionIcon = ({
  onPress,
  name,
  color,
  customStyle,
  size = SIZE.xxxl,
  iconStyle = {},
  left = 10,
  right = 10,
  top = 30,
  bottom = 30,
  testID,
  disabled,
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <PressableButton
      testID={testID}
      onPress={onPress}
      hitSlop={{top: top, left: left, right: right, bottom: bottom}}
      color="transparent"
      disabled={disabled}
      selectedColor={colors.nav}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={1}
      customStyle={{
        width: 40,
        height: 40,
        backgroundColor: disabled ? colors.bg : null,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        ...customStyle,
      }}>
      <Icon
        name={name}
        style={iconStyle}
        color={
          disabled ? RGB_Linear_Shade(-0.05, hexToRGBA(colors.nav)) : color
        }
        size={size}
      />
    </PressableButton>
  );
};
