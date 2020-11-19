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
          paddingBottom:Platform.OS === "ios" && size? size/3.5:3.5
        },
        style,
      ]}></Text>
  );
};

export default Heading;
