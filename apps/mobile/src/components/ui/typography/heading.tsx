import React from 'react';
import { Platform, TextProps } from 'react-native';
import { Text } from 'react-native';
import { useThemeStore } from '../../../stores/theme';
import { SIZE } from '../../../utils/size';

interface HeadingProps extends TextProps {
  color?: string;
  size?: number;
}

const Heading = ({ color, size = SIZE.xl, style, ...restProps }: HeadingProps) => {
  const colors = useThemeStore(state => state.colors);

  return (
    <Text
      allowFontScaling={true}
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontSize: size || SIZE.xl,
          color: color || colors.heading,
          fontFamily: Platform.OS === 'android' ? 'OpenSans-SemiBold' : undefined,
          fontWeight: Platform.OS === 'ios' ? '600' : undefined
        },
        style
      ]}
    ></Text>
  );
};

export default Heading;
