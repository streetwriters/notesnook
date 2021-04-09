import React, { useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { eScrollEvent } from '../../utils/Events';
import Heading from '../Typography/Heading';

const opacity = new Animated.Value(DDS.isLargeTablet() ? 1 : 0);

let scrollPostions = {};

export const HeaderTitle = ({heading,headerColor}) => {
  const [state] = useTracked();
  const {colors} = state;
 

  const onScroll = async (y) => {
    if (DDS.isTab) return;
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
    scrollPostions[heading] = y;
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [heading]);
  
  return (
    <Animated.View
      style={{
        opacity: DDS.isTab ? 1 : opacity,
      }}>
      <Heading color={headerColor}>
        <Heading color={colors.accent}>
          {heading.slice(0, 1) === '#' ? '#' : null}
        </Heading>

        {heading.slice(0, 1) === '#'
          ? heading.slice(1)
          : heading}
      </Heading>
    </Animated.View>
  );
};
