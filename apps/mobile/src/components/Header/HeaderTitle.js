import React, { useEffect } from 'react';
import Animated, { useValue } from 'react-native-reanimated';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eScrollEvent } from '../../utils/Events';
import Heading from '../Typography/Heading';


export const HeaderTitle = ({heading,headerColor,screen}) => {
  const [state] = useTracked();
  const {colors} = state;
  const opacity = useValue(DDS.isLargeTablet() ? 1 : 0)

  const onScroll = async (data) => {
    if (data.screen !== screen) return;
    if (DDS.isTab) return;
    if (data.y > 75) {
      let yVal = data.y - 75;
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
