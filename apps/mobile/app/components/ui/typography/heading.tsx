import React, { useMemo } from "react";
import { Platform, TextProps } from "react-native";
import { Text } from "react-native";
import Animated, {
  ComplexAnimationBuilder,
  Layout
} from "react-native-reanimated";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";

interface HeadingProps extends TextProps {
  color?: string;
  size?: number;
  layout?: ComplexAnimationBuilder;
  animated?: boolean;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

const Heading = ({
  color,
  size = SIZE.xl,
  style,
  animated,
  ...restProps
}: HeadingProps) => {
  const colors = useThemeStore((state) => state.colors);
  const Component = useMemo(() => (animated ? AnimatedText : Text), [animated]);

  return (
    <Component
      layout={restProps.layout || Layout}
      allowFontScaling={true}
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontSize: size || SIZE.xl,
          color: color || colors.heading,
          fontFamily:
            Platform.OS === "android" ? "OpenSans-SemiBold" : undefined,
          fontWeight: Platform.OS === "ios" ? "600" : undefined
        },
        style
      ]}
    ></Component>
  );
};

export default Heading;
