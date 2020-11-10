import React, {useEffect} from 'react';
import {Text} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {eScrollEvent} from '../../utils/Events';
import Heading from '../Typography/Heading';

const opacity = new Animated.Value(0);

export const HeaderTitle = () => {
  const [state] = useTracked();
  const {colors, headerTextState} = state;

  const onScroll = async (y) => {
    if (y > 75) {
      let yVal = y - 75;
      o = yVal / 75;
      opacity.setValue(o);
    } else {
      opacity.setValue(0);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  return (
    <Animated.View
      style={{
        opacity: opacity,
      }}>
      <Heading color={headerTextState.color}>
        <Text
          style={{
            color: colors.accent,
          }}>
          {headerTextState.heading.slice(0, 1) === '#' ? '#' : null}
        </Text>

        {headerTextState.heading.slice(0, 1) === '#'
          ? headerTextState.heading.slice(1)
          : headerTextState.heading}
      </Heading>
    </Animated.View>
  );
};
