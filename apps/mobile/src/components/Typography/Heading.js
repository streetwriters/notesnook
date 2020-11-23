import React from 'react';
import {Text} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';

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
const Heading = ({color, size, style, ...restProps}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <Text
      {...restProps}
      style={[
        {
          fontFamily: WEIGHT.bold,
          fontSize: size || SIZE.xl,
          color: color || colors.heading,
          lineHeight:
            Platform.OS === 'ios' ? (size ? size + 2 : SIZE.xl + 2) : null,
        },
        style,
      ]}></Text>
  );
};

export default Heading;
