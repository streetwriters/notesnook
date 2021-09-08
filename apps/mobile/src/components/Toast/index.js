import React, {useEffect, useState} from 'react';
import {Keyboard, View} from 'react-native';
import Animated, {Easing, useValue} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {dHeight, getElevation} from '../../utils';
import {eHideToast, eShowToast} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
const {timing} = Animated;

let toastMessages = [];
export const Toast = ({context = 'global'}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [keyboard, setKeyboard] = useState(false);
  const [data, setData] = useState({});
  const [toastStyle, setToastStyle] = useState({
    backgroundColor: colors.errorBg,
    color: colors.errorText
  });
  const insets = useSafeAreaInsets();

  let toastTranslate = useValue(-dHeight);
  let toastOpacity = useValue(0);

  const showToastFunc = async data => {
    if (data.context !== context) return;
    if (toastMessages.findIndex(m => m.message === data.message) >= 0) {
      console.log('returning from here');
      return;
    }
    toastMessages.push(data);
    if (toastMessages?.length > 1) return;
    setData(data);
    if (data.type === 'success') {
      setToastStyle({
        color: colors.successText
      });
    } else {
      setToastStyle({
        color: colors.errorText
      });
    }
    toastTranslate.setValue(-dHeight);
    toastTranslate.setValue(0);
    await sleep(50);
    timing(toastOpacity, {
      toValue: 1,
      duration: 150,
      easing: Easing.ease
    }).start();

    setTimeout(() => {
      hideToastFunc();
    }, data.duration);
  };

  const showNext = data => {
    if (!data) {
      hideToastFunc() 
      return;
    }
    setData(data);
    if (data.type === 'success') {
      setToastStyle({
        color: colors.successText
      });
    } else {
      setToastStyle({
        color: colors.errorText
      });
    }
    setTimeout(() => {
      hideToastFunc();
    }, data?.duration);
  };

  const hideToastFunc = () => {
    let msg = toastMessages.shift();
    if (msg) {
      timing(toastOpacity, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.ease)
      }).start(() => {
        showNext(msg);
        setTimeout(() => {
          timing(toastOpacity, {
            toValue: 1,
            duration: 150,
            easing: Easing.in(Easing.ease)
          }).start();
        }, 300);
      });
    } else {
      timing(toastOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.inOut(Easing.ease)
      }).start(async () => {
        await sleep(100);
        toastTranslate.setValue(-dHeight);
        toastMessages.shift();
        setData({});
      });
    }
  };

  const _onKeyboardShow = () => {
    setKeyboard(true);
  };

  const _onKeyboardHide = () => {
    setKeyboard(false);
  };

  useEffect(() => {
    toastMessages = [];
    toastTranslate.setValue(-dHeight);
    toastOpacity.setValue(0);
    Keyboard.addListener('keyboardDidShow', _onKeyboardShow);
    Keyboard.addListener('keyboardDidHide', _onKeyboardHide);
    eSubscribeEvent(eShowToast, showToastFunc);
    eSubscribeEvent(eHideToast, hideToastFunc);
    return () => {
      toastMessages = [];
      Keyboard.removeListener('keyboardDidShow', _onKeyboardShow);
      Keyboard.removeListener('keyboardDidHide', _onKeyboardHide);
      eUnSubscribeEvent(eShowToast, showToastFunc);
      eUnSubscribeEvent(eHideToast, hideToastFunc);
    };
  }, [keyboard]);

  return (
    <Animated.View
      onTouchEnd={() => {
        hideToastFunc();
      }}
      style={{
        width: DDS.isTab ? 400 : '100%',
        alignItems: 'center',
        alignSelf: 'center',
        minHeight: 30,
        top: insets.top + 10,
        position: 'absolute',
        zIndex: 999,
        elevation: 15,
        transform: [
          {
            translateY: toastTranslate
          }
        ]
      }}>
      <Animated.View
        activeOpacity={0.8}
        style={{
          ...getElevation(5),
          ...toastStyle,
          maxWidth: '95%',
          backgroundColor: colors.nav,
          minWidth: data.func ? '95%' : '50%',
          alignSelf: 'center',
          borderRadius: 5,
          opacity: toastOpacity,
          minHeight: 30,
          paddingVertical: 10,
          paddingLeft: 12,
          paddingRight: 5,
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          width: '95%'
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGrow: 1,
            flex: 1
          }}>
          <View
            style={{
              height: 30,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}>
            <Icon
              name={data.type === 'success' ? 'check' : 'close'}
              size={SIZE.lg}
              color={data.type === 'error' ? colors.errorText : colors.accent}
            />
          </View>

          <View
            style={{
              flexGrow: 1,
              paddingRight: 25
            }}>
            {data?.heading ? (
              <Heading
                color={colors.pri}
                size={SIZE.md}
                onPress={() => {
                  hideToastFunc();
                }}>
                {data.heading}
              </Heading>
            ) : null}

            {data?.message ? (
              <Paragraph
                color={colors.pri}
                style={{
                  maxWidth: '100%',
                  paddingRight: 10
                }}
                onPress={() => {
                  hideToastFunc();
                }}>
                {data.message}
              </Paragraph>
            ) : null}
          </View>
        </View>

        {data.func ? (
          <Button
            fontSize={SIZE.md}
            type={data.type === 'error' ? 'errorShade' : 'transparent'}
            onPress={data.func}
            title={data.actionText}
            height={30}
          />
        ) : null}
      </Animated.View>
    </Animated.View>
  );
};
