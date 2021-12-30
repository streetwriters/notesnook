import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import {dWidth, editing, getElevation} from '../../utils';
import {
  eCloseActionSheet,
  eOpenPremiumDialog,
  eShowGetPremium
} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {EditorWebView} from '../../views/Editor/Functions';
import tiny from '../../views/Editor/tiny/tiny';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const translatePrem = new Animated.Value(-dWidth);
export const opacityPrem = new Animated.Value(0);
let timer = null;
let currentMsg = {
  title: '',
  desc: ''
};
export const PremiumToast = ({close, context = 'global', offset = 0}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [msg, setMsg] = useState(currentMsg);

  const open = event => {
    if (!event) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      currentMsg = {
        title: '',
        desc: ''
      };
      setMsg(currentMsg);
      opacityPrem.setValue(0);
      translatePrem.setValue(-dWidth);
      return;
    }

    if (event.context === context && currentMsg?.desc !== event.desc) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      opacityPrem.setValue(0);
      translatePrem.setValue(-dWidth);
      currentMsg = {
        title: event.title,
        desc: event.desc
      };
      setMsg(currentMsg);
      opacityPrem.setValue(1);
      Animated.timing(opacityPrem, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      }).start();
      Animated.timing(translatePrem, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      }).start();

      let timer = setTimeout(async () => {
        Animated.timing(opacityPrem, {
          toValue: -0,
          duration: 150,
          easing: Easing.inOut(Easing.ease)
        }).start();
        currentMsg = {
          title: '',
          desc: ''
        };
        await sleep(150);
        setMsg(currentMsg);
        opacityPrem.setValue(0);
        translatePrem.setValue(-dWidth);
      }, 3000);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eShowGetPremium, open);
    return () => {
      translatePrem.setValue(-dWidth);
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
    <Animated.View
      style={{
        position: 'absolute',
        backgroundColor: colors.nav,
        zIndex: 999,
        ...getElevation(10),
        padding: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'space-between',
        top: offset,
        opacity: opacityPrem,
        maxWidth: DDS.isLargeTablet() ? 400 : '98%',
        transform: [
          {
            translateY: translatePrem
          }
        ]
      }}>
      <View
        style={{
          flexShrink: 1,
          flexGrow: 1,
          paddingRight: 6
        }}>
        <Heading
          style={{
            flexWrap: 'wrap'
          }}
          color={colors.accent}
          size={SIZE.md}>
          {msg.title}
        </Heading>

        <Paragraph
          style={{
            flexWrap: 'wrap'
          }}
          size={SIZE.sm}
          color={colors.pri}>
          {msg.desc}
        </Paragraph>
      </View>

      <Button onPress={onPress} title="Get Now" type="accent" />
    </Animated.View>
  );
};
