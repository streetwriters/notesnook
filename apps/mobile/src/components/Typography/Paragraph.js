import React from 'react';
import {Platform, Text} from 'react-native';
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
const Paragraph = ({color, size, style, ...restProps}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <Text

      {...restProps}
      style={[
        {
          fontFamily: WEIGHT.regular,
          fontSize: size || SIZE.sm,
          color: color || colors.pri,
          fontWeight:'400',
          paddingBottom:Platform.OS === "ios" && size? size/3.5:3.5
        },
        style,
      ]}></Text>
  );
};

export default Paragraph
