import React, {useEffect} from 'react';
import {Text} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {eScrollEvent} from '../../utils/Events';
import Heading from '../Typography/Heading';

const opacity = new Animated.Value(0);

let scrollPostions = {};

export const HeaderTitle = () => {
  const [state] = useTracked();
  const {colors, headerTextState} = state;

  const onScroll = async (y) => {
    if (typeof y !== 'number') {
      if (y.type === 'back') {
        scrollPostions[y.name] = null;
        return;
      }
      if (scrollPostions[y.name]) {
        if (scrollPostions[y.name] > 200) {
          opacity.setValue(1);
        } else {
          scrollPostions[y.name] = 0;
          opacity.setValue(0);
        }
      } else {
        scrollPostions[y.name] = 0;
        opacity.setValue(0);
      }
      return;
    }

    if (y > 75) {
      let yVal = y - 75;
      o = yVal / 75;
      opacity.setValue(o);
    } else {
      opacity.setValue(0);
    }
    scrollPostions[headerTextState.heading] = y;

  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [headerTextState.heading]);

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
