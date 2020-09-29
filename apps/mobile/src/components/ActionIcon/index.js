import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE} from '../../common/common';
import {useTracked} from '../../provider';
import {PressableButton} from '../PressableButton';

export const ActionIcon = ({
  onPress,
  name,
  color,
  customStyle,
  size = SIZE.xxxl,
  iconStyle = {},
  left = 10,
  right = 10,
  testID,
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <PressableButton
      testID={testID}
      onPress={onPress}
      hitSlop={{top: 30, left: left, right: right, bottom: 30}}
      color="transparent"
      selectedColor={colors.nav}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={1}
      customStyle={{
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        ...customStyle,
      }}>
      <Icon name={name} style={iconStyle} color={color} size={size} />
    </PressableButton>
  );
};
