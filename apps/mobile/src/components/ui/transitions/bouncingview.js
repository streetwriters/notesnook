import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

export const BouncingView = ({
  children,
  style,
  duration = 600,
  animated = true,
  initialScale = 0.9
}) => {
  const scale = useSharedValue(!animated ? 1 : initialScale);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: !animated ? 1 : scale.value
        }
      ]
    };
  });

  useEffect(() => {
    if (!animated) return;
    scale.value = initialScale;
    scale.value = withTiming(1, {
      duration: duration,
      easing: Easing.elastic(1)
    });
    return () => {
      if (!animated) return;
      scale.value = initialScale;
    };
  }, []);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};
