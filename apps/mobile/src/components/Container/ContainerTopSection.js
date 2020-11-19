import React, {useEffect} from 'react';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {Header} from '../Header';

export const ContainerTopSection = ({root}) => {
  const [state,] = useTracked();
  const {colors, selectionMode} = state;
  const opacity = useValue(0);
  const translateY = useValue(0);
  useEffect(() => {
    Animated.timing(opacity, {
      duration: 100,
      toValue: selectionMode ? 0 : 1,
      easing: Easing.in(Easing.ease),
    }).start();
    Animated.timing(translateY, {
      toValue: selectionMode ? -150 : 0,
      duration: 100,
      easing: Easing.in(Easing.ease),
    }).start();
  }, [selectionMode]);

  return (
    <Animated.View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        opacity: opacity,
        overflow: 'hidden',
        transform: [
          {
            translateY: translateY,
          },
        ],
      }}>
     <Header root={root} />
    </Animated.View>
  );
};
