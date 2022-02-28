import React, { useEffect, useState } from 'react';
import Animated, { Easing, timing, useValue } from 'react-native-reanimated';
import { useTracked } from '../../../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../../services/EventManager';
import { sleep } from '../../../../utils/time';

const ToolbarItemPin = ({ format, color }) => {
  const [state] = useTracked();
  const { colors } = state;
  const [visible, setVisible] = useState(false);
  let scale = useValue(0);
  useEffect(() => {
    eSubscribeEvent('showTooltip', show);
    return () => {
      eUnSubscribeEvent('showTooltip', show);
    };
  }, []);

  let animating = false;
  async function animate(val, time = 200) {
    if (animating) return;
    animating = true;
    timing(scale, {
      toValue: val,
      duration: time,
      easing: Easing.in(Easing.ease)
    }).start();
    await sleep(time);
    animating = false;
  }

  const show = async data => {
    if (data?.title === format) {
      setVisible(true);
      await sleep(5);
      animate(1, 150);
    } else {
      animate(0, 150);
      await sleep(100);
      setVisible(false);
    }
  };

  return (
    visible && (
      <Animated.View
        style={{
          width: '100%',
          height: 3,
          backgroundColor: color || colors.accent,
          position: 'absolute',
          top: 0,
          transform: [
            {
              scale: scale
            }
          ]
        }}
      />
    )
  );
};

export default ToolbarItemPin;
