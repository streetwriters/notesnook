import React from 'react';
import {ActivityIndicator, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {PressableButton} from '../PressableButton';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';
import Heading from '../Typography/Heading';

const BUTTON_TYPES = {
  transparent: {
    primary: 'transparent',
    text: 'accent',
    selected: 'shade',
  },
  gray: {
    primary: 'transparent',
    text: 'icon',
    selected: 'nav',
  },
  grayBg: {
    primary: 'nav',
    text: 'icon',
    selected: 'nav',
  },
  accent: {
    primary: 'accent',
    text: 'light',
    selected: 'accent',
  },
  inverted: {
    primary: 'bg',
    text: 'accent',
    selected: 'bg',
  },

  shade: {
    primary: 'shade',
    text: 'accent',
    selected: 'accent',
    opacity: 0.12,
  },
};

export const Button = ({
  height = 40,
  width = null,
  onPress = () => {},
  loading = false,
  title = '',
  icon,
  fontSize = SIZE.sm,
  type = 'transparent',
  iconSize = SIZE.md,
  style = {},
}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <PressableButton
      onPress={onPress}
      disabled={loading}
      color={colors[BUTTON_TYPES[type].primary]}
      selectedColor={colors[BUTTON_TYPES[type].selected]}
      alpha={!colors.night ? -0.04 : 0.04}
      opacity={BUTTON_TYPES[type].opacity || 1}
      customStyle={{
        height: height,
        width: width || null,
        paddingVertical: pv,
        paddingHorizontal: ph,
        borderRadius: 5,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        ...style,
      }}>
      {loading && <ActivityIndicator color={colors[BUTTON_TYPES[type].text]} />}
      {icon && !loading && (
        <Icon
          name={icon}
          style={{
            marginRight: 0,
          }}
          color={colors[BUTTON_TYPES[type].text]}
          size={iconSize}
        />
      )}
      {!title ? null : (
        <Heading
          color={colors[BUTTON_TYPES[type].text]}
          size={fontSize}
          style={{
            marginLeft: icon || loading ? 5 : 0,
          }}>
          {title}
        </Heading>
      )}
    </PressableButton>
  );
};

const styles = StyleSheet.create({
  activityText: {
    fontSize: SIZE.sm,
    textAlign: 'center',
  },
  activityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
