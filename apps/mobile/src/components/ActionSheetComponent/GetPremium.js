import React, {useEffect, useState} from 'react';
import Animated, {Easing} from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {eOpenPremiumDialog, eShowGetPremium} from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const translate = new Animated.Value(-800);

export const GetPremium = ({close, context = 'global',offset=0}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [msg, setMsg] = useState({
    title: '',
    desc: '',
  });

  const open = (event) => {
    if (event.context === context) {
      setMsg({
        title: event.title,
        desc: event.desc,
      });
      Animated.timing(translate, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }).start();

      setTimeout(async () => {
        Animated.timing(translate, {
          toValue: +800,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        }).start();
        await sleep(200);
        translate.setValue(-800);
      }, 5000);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eShowGetPremium, open);
    return () => {
      eUnSubscribeEvent(eShowGetPremium, open);
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        backgroundColor: colors.accent,
        zIndex: 999,
        ...getElevation(10),
        padding: 12,
        borderRadius: 5,
        flexDirection: 'row',
        alignSelf: 'center',
		justifyContent: 'space-between',
		top:offset,
        transform: [
          {
            translateX: translate,
          },
        ],
      }}>
      <Heading size={SIZE.md} color="white" style={{maxWidth: '75%', paddingRight: 6}}>
        {msg.title}
        {'\n'}
        <Paragraph color="white">{msg.desc}</Paragraph>
      </Heading>

      <Button
        onPress={async () => {
          close();
          await sleep(300);
          eSendEvent(eOpenPremiumDialog);
        }}
        width={80}
        title="Get Now"
        type="inverted"
      />
    </Animated.View>
  );
};
