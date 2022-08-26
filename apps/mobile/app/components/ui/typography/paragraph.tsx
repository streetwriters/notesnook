import React, { useMemo } from "react";
import { Text, TextProps } from "react-native";
import Animated, {
  ComplexAnimationBuilder,
  Layout
} from "react-native-reanimated";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
interface ParagraphProps extends TextProps {
  color?: string;
  size?: number;
  layout?: ComplexAnimationBuilder;
  animated?: boolean;
}
const AnimatedText = Animated.createAnimatedComponent(Text);

const Paragraph = ({
  color,
  size = SIZE.sm,
  style,
  animated,
  ...restProps
}: ParagraphProps) => {
  const colors = useThemeStore((state) => state.colors);
  const Component = useMemo(() => (animated ? AnimatedText : Text), [animated]);

  return (
    <Component
      layout={restProps.layout || Layout}
      allowFontScaling
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontSize: size || SIZE.sm,
          color: color || colors.pri,
          fontWeight: "400",
          fontFamily: "OpenSans-Regular"
        },
        style
      ]}
    />
  );
};

export default Paragraph;
