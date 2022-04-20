import React from 'react';
import { Text, TextProps } from 'react-native';
import Animated, { ComplexAnimationBuilder, Layout } from 'react-native-reanimated';
import { useThemeStore } from '../../../stores/theme';
import { SIZE } from '../../../utils/size';

interface ParagraphProps extends TextProps {
  color?: string;
  size?: number;
  layout?: ComplexAnimationBuilder;
}
const AnimatedText = Animated.createAnimatedComponent(Text);

const Paragraph = ({ color, size = SIZE.sm, style, ...restProps }: ParagraphProps) => {
  const colors = useThemeStore(state => state.colors);

  return (
    <AnimatedText
      layout={restProps.layout || Layout}
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
    ></AnimatedText>
  );
};

export default Paragraph;
