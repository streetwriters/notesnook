import React, { useEffect } from 'react';
import Animated, { Easing, timing } from 'react-native-reanimated';

export const BouncingView = ({children,style,duration=600}) => {
  const scale = Animated.useValue(0.9);
 
  useEffect(() => {
    scale.setValue(0.9);
    timing(scale, {
      toValue: 1,
      duration:duration,
      easing: Easing.elastic(1)
    }).start();
    return () => {
      scale.setValue(0.9);
    }
  },[])

  return (
    <Animated.View
      style={[{
        transform: [
          {
            scale: scale
          }
        ]
      },style]}>
      {children}
    </Animated.View>
  );
};
