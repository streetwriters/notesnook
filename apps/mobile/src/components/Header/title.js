import React, { useEffect } from 'react';
import Animated, { useValue } from 'react-native-reanimated';
import { useTracked } from '../../provider';
import { useSettingStore } from '../../provider/stores';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eScrollEvent } from '../../utils/Events';
import Heading from '../Typography/Heading';

export const Title = ({heading,headerColor,screen}) => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const opacity = useValue(deviceMode !== "mobile" ? 1 : 0)

  const onScroll = async (data) => {
    if (data.screen !== screen) return;
    if (deviceMode !== "mobile") return;
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
        opacity: deviceMode !== "mobile" ? 1 : opacity,
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
