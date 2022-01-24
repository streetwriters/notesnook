import React from 'react';
import { Platform } from 'react-native';
import { Text } from 'react-native';
import { useTracked } from '../../provider';
import { SIZE } from '../../utils/SizeUtils';

/**
 *
 * @typedef {import('react-native').TextProps} TextType
 * @typedef {Object} restTypes
 * @property {string} color color
 * @property {number} size color
 */
/**
 *
 * @param {TextType | restTypes} props all props
 */
const Heading = ({ color, size = SIZE.xl, style, ...restProps }) => {
  const [state] = useTracked();
  const { colors } = state;

  return (
    <Text
      allowFontScaling={true}
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontSize: size || SIZE.xl,
          color: color || colors.heading,
          fontFamily: Platform.OS === 'android' ? 'OpenSans-SemiBold' : null,
          fontWeight: Platform.OS === 'ios' ? '600' : null
        },
        style
      ]}
    ></Text>
  );
};

export default Heading;
