import React from 'react';
import {Text} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';

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
const Heading = ({color, size = SIZE.xl, style, ...restProps}) => {
  const [state] = useTracked();
  const {colors} = state;
  let fontSize = size || SIZE.xl;

  return (
    <Text
      allowFontScaling={true}
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontFamily: 'sans-serif',
          fontSize: size || SIZE.xl,
          color: color || colors.heading,
          fontWeight: 'bold',
        },
        style,
      ]}></Text>
  );
};

export default Heading;
