import React, {useEffect, useState} from 'react';
import {Keyboard} from 'react-native';
import {Platform, View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {dWidth, editing, getElevation} from '../../utils';
import {
  eCloseActionSheet,
  eOpenPremiumDialog,
  eShowGetPremium,
} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {EditorWebView, post} from '../../views/Editor/Functions';
import tiny from '../../views/Editor/tiny/tiny';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const translatePrem = new Animated.Value(-dWidth * 5);
export const opacityPrem = new Animated.Value(0);
let timer = null;
let currentMsg = {
  title: '',
  desc: '',
};
export const GetPremium = ({close, context = 'global', offset = 0}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [msg, setMsg] = useState(currentMsg);

  const open = (event) => {
    if (!event) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      currentMsg = {
        title: '',
        desc: '',
      };
      setMsg(currentMsg);
      opacityPrem.setValue(0);
      translatePrem.setValue(-dWidth * 5);
      return;
    }

    if (event.context === context && currentMsg?.desc !== event.desc) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      opacityPrem.setValue(0);
      translatePrem.setValue(-dWidth * 5);
      currentMsg = {
        title: event.title,
        desc: event.desc,
      };
      setMsg(currentMsg);
      opacityPrem.setValue(1);
      Animated.timing(translatePrem, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      }).start();

      let timer = setTimeout(async () => {
        Animated.timing(translatePrem, {
          toValue: dWidth * 2,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        }).start();
        currentMsg = {
          title: '',
          desc: '',
        };
        setMsg(currentMsg);
        await sleep(200);
        opacityPrem.setValue(0);
        translatePrem.setValue(-dWidth * 5);
      }, 5000);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eShowGetPremium, open);
    return () => {
      translatePrem.setValue(-dWidth * 5);
      eUnSubscribeEvent(eShowGetPremium, open);
    };
  }, []);

  const onPress = async () => {
    open(null);
    eSendEvent(eCloseActionSheet);
    if (editing.isFocused) {
      tiny.call(EditorWebView,tiny.blur)
    }
    await sleep(300);
    eSendEvent(eOpenPremiumDialog);
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        backgroundColor: colors.accent,
        zIndex: 999,
        ...getElevation(10),
        padding: 12,
        paddingVertical: 20,
        borderRadius: 5,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'space-between',
        top: offset,
        opacity: opacityPrem,
        maxWidth: DDS.isLargeTablet() ? 400 : '100%',
        transform: [
          {
            translateX: translatePrem,
          },
        ],
      }}>
      <View
        style={{
          width: '75%',
          maxWidth: '75%',
          paddingRight: 6,
          justifyContent: 'center',
        }}>
        <Heading color="white" size={SIZE.md}>
          {msg.title}
        </Heading>

        <Paragraph style={{margin: 0}} size={SIZE.sm} color="white">
          {msg.desc}
        </Paragraph>
      </View>

      <Button onPress={onPress} width={80} title="Get Now" type="inverted" />
    </Animated.View>
  );
};
