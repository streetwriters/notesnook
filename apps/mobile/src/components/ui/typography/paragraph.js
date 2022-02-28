import React from 'react';
import { Text } from 'react-native';
import { useThemeStore } from '../../../stores/theme';
import { SIZE } from '../../../utils/size';

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
const Paragraph = ({ color, size = SIZE.sm, style, ...restProps }) => {
  const colors = useThemeStore(state => state.colors);

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontSize: size || SIZE.sm,
          color: color || colors.pri,
          fontWeight: '400',
          fontFamily: 'OpenSans-Regular'
        },
        style
      ]}
    ></Text>
  );
};

export default Paragraph;
