import React, {useEffect} from 'react';
import Animated, {Easing, timing} from 'react-native-reanimated';

export const BouncingView = ({
  children,
  style,
  duration = 600,
  animated = true
}) => {
  const scale = Animated.useValue(!animated ? 1 : 0.9);

  useEffect(() => {
    if (!animated) return;
    scale.setValue(0.9);
    timing(scale, {
      toValue: 1,
      duration: duration,
      easing: Easing.elastic(1)
    }).start();
    return () => {
      if (!animated) return;
      scale.setValue(0.9);
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
