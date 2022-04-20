import React, { useEffect, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../../services/event-manager';
import { useThemeStore } from '../../../../stores/theme';
import { sleep } from '../../../../utils/time';

const ToolbarItemPin = ({ format, color }) => {
  const colors = useThemeStore(state => state.colors);
  const [visible, setVisible] = useState(false);
  let scale = useSharedValue(0);

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
    scale.value = withTiming(val, {
      duration: time,
      easing: Easing.in(Easing.ease)
    });
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value
        }
      ]
    };
  }, []);

  return (
    visible && (
      <Animated.View
        style={[
          {
            width: '100%',
            height: 3,
            backgroundColor: color || colors.accent,
            position: 'absolute',
            top: 0
          },
          animatedStyle
        ]}
      />
    )
  );
};

export default ToolbarItemPin;
