import React, { useEffect } from 'react';
import Animated, { Easing, timing } from 'react-native-reanimated';

export const BouncingView = ({children}) => {
  const scale = Animated.useValue(0.9);
 
  useEffect(() => {
    scale.setValue(0.9);
    timing(scale, {
      toValue: 1,
      duration: 600,
      easing: Easing.elastic(1)
    }).start();
    return () => {
      scale.setValue(0.9);
    }
  },[])

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: scale
          }
        ]
      }}>
      {children}
    </Animated.View>
  );
};
