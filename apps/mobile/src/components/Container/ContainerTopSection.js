import React, {useEffect} from 'react';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {Header} from '../header';
import {Search} from '../SearchInput';

export const ContainerTopSection = ({root}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const opacity = useValue(0);
  useEffect(() => {
    Animated.timing(opacity, {
      duration: 100,
      toValue: selectionMode ? 0 : 1,
      easing: Easing.in(Easing.ease),
    }).start();
  }, [selectionMode]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        backgroundColor: colors.bg,
        zIndex: 998,
        display: 'flex',
        width: '100%',
        opacity: opacity,
      }}>
      <Header root={root} />

      <Search root={root} />
    </Animated.View>
  );
};
