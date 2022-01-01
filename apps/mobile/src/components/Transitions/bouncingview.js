import React, {useEffect, useState} from 'react';
import Animated, {Easing, timing} from 'react-native-reanimated';

export const BouncingView = ({
  children,
  style,
  duration = 600,
  animated = true,
  initialScale = 0.9
}) => {
  const scale = Animated.useValue(!animated ? 1 : initialScale);

  useEffect(() => {
    if (!animated) return;
    scale.setValue(initialScale);
    timing(scale, {
      toValue: 1,
      duration: duration,
      easing: Easing.elastic(1)
    }).start();
    return () => {
      if (!animated) return;
      scale.setValue(initialScale);
    };
  }, []);

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              scale: !animated ? 1 : scale
            }
          ]
        },
        style
      ]}>
      {children}
    </Animated.View>
  );
};
