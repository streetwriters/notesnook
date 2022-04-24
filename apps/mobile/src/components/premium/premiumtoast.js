import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { EditorWebView } from '../../screens/editor/Functions';
import tiny from '../../screens/editor/tiny/tiny';
import { DDS } from '../../services/device-detection';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/use-theme-store';
import { editing, getElevation } from '../../utils';
import { eCloseActionSheet, eOpenPremiumDialog, eShowGetPremium } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { Button } from '../ui/button';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

export const PremiumToast = ({ close, context = 'global', offset = 0 }) => {
  const colors = useThemeStore(state => state.colors);
  const [msg, setMsg] = useState(null);
  const timer = useRef();

  const open = event => {
    if (!event) {
      clearTimeout(timer);
      timer.current = null;
      setMsg(null);
      return;
    }

    if (event.context === context && msg?.desc !== event.desc) {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      setMsg(event);
      timer.current = setTimeout(async () => {
        setMsg(null);
      }, 3000);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eShowGetPremium, open);
    return () => {
      clearTimeout(timer.current);
      eUnSubscribeEvent(eShowGetPremium, open);
    };
  }, []);

  const onPress = async () => {
    open(null);
    eSendEvent(eCloseActionSheet);
    if (editing.isFocused) {
      tiny.call(EditorWebView, tiny.blur);
    }
    await sleep(300);
    eSendEvent(eOpenPremiumDialog);
  };

  return (
    !!msg && (
      <Animated.View
        entering={FadeInUp}
        exiting={FadeOutUp}
        style={{
          position: 'absolute',
          backgroundColor: colors.nav,
          zIndex: 999,
          ...getElevation(20),
          padding: 12,
          borderRadius: 10,
          flexDirection: 'row',
          alignSelf: 'center',
          justifyContent: 'space-between',
          top: offset,
          maxWidth: DDS.isLargeTablet() ? 400 : '98%'
        }}
      >
        <View
          style={{
            flexShrink: 1,
            flexGrow: 1,
            paddingRight: 6
          }}
        >
          <Heading
            style={{
              flexWrap: 'wrap'
            }}
            color={colors.accent}
            size={SIZE.md}
          >
            {msg.title}
          </Heading>

          <Paragraph
            style={{
              flexWrap: 'wrap'
            }}
            size={SIZE.sm}
            color={colors.pri}
          >
            {msg.desc}
          </Paragraph>
        </View>

        <Button onPress={onPress} title="Get Now" type="accent" />
      </Animated.View>
    )
  );
};
