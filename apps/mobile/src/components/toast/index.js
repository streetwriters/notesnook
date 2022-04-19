import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import Animated, { EasingNode, useValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import { useThemeStore } from '../../stores/theme';
import { DDS } from '../../services/device-detection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { dHeight, getElevation } from '../../utils';
import { eHideToast, eShowToast } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { Button } from '../ui/button';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
const { timing } = Animated;

let toastMessages = [];
export const Toast = ({ context = 'global' }) => {
  const colors = useThemeStore(state => state.colors);
  const [keyboard, setKeyboard] = useState(false);
  const [data, setData] = useState({});
  const [toastStyle, setToastStyle] = useState({
    backgroundColor: colors.errorBg,
    color: colors.errorText
  });
  const insets = useSafeAreaInsets();
  const hideTimeout = useRef();
  let toastTranslate = useValue(-dHeight);
  let toastOpacity = useValue(0);

  const showToastFunc = async data => {
    console.log('toast show', data.message, toastMessages.length);
    if (!data) return;
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
    await sleep(1);
    timing(toastOpacity, {
      toValue: 1,
      duration: 150,
      easing: EasingNode.ease
    }).start();

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    hideTimeout.current = setTimeout(() => {
      hideToastFunc();
    }, data.duration);
  };

  const showNext = data => {
    if (!data) {
      hideToastFunc();
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
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    hideTimeout.current = setTimeout(() => {
      hideToastFunc();
    }, data?.duration);
  };

  const hideToastFunc = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    let msg = toastMessages.length > 1 ? toastMessages.shift() : null;

    if (msg) {
      timing(toastOpacity, {
        toValue: 0,
        duration: 100,
        easing: EasingNode.in(EasingNode.ease)
      }).start(() => {
        showNext(msg);
        setTimeout(() => {
          timing(toastOpacity, {
            toValue: 1,
            duration: 150,
            easing: EasingNode.in(EasingNode.ease)
          }).start();
        }, 300);
      });
    } else {
      timing(toastOpacity, {
        toValue: 0,
        duration: 150,
        easing: EasingNode.inOut(EasingNode.ease)
      }).start(async () => {
        toastMessages.shift();
        await sleep(100);
        toastTranslate.setValue(-dHeight);
        setData({});
        if (hideTimeout.current) {
          clearTimeout(hideTimeout.current);
        }
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
    let sub1 = Keyboard.addListener('keyboardDidShow', _onKeyboardShow);
    let sub2 = Keyboard.addListener('keyboardDidHide', _onKeyboardHide);
    eSubscribeEvent(eShowToast, showToastFunc);
    eSubscribeEvent(eHideToast, hideToastFunc);
    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }

      toastMessages = [];
      sub1?.remove();
      sub2?.remove();
      eUnSubscribeEvent(eShowToast, showToastFunc);
      eUnSubscribeEvent(eHideToast, hideToastFunc);
    };
  }, [keyboard]);

  return (
    <Animated.View
      onTouchEnd={() => {
        if (!data.func) {
          if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
          }
          hideToastFunc();
        }
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
      }}
    >
      <Animated.View
        activeOpacity={0.8}
        style={{
          ...getElevation(5),
          ...toastStyle,
          maxWidth: '95%',
          backgroundColor: colors.nav,
          minWidth: data?.func ? '95%' : '50%',
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
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGrow: 1,
            flex: 1
          }}
        >
          <View
            style={{
              height: 30,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}
          >
            <Icon
              name={data?.type === 'success' ? 'check' : 'close'}
              size={SIZE.lg}
              color={data?.type === 'error' ? colors.errorText : colors.accent}
            />
          </View>

          <View
            style={{
              flexGrow: 1,
              paddingRight: 25
            }}
          >
            {data?.heading ? (
              <Heading
                color={colors.pri}
                size={SIZE.md}
                onPress={() => {
                  hideToastFunc();
                }}
              >
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
                }}
              >
                {data.message}
              </Paragraph>
            ) : null}
          </View>
        </View>

        {data.func ? (
          <Button
            testID={notesnook.toast.button}
            fontSize={SIZE.md}
            type={data.type === 'error' ? 'errorShade' : 'transparent'}
            onPress={data.func}
            title={data.actionText}
            height={30}
            style={{
              zIndex: 10
            }}
          />
        ) : null}
      </Animated.View>
    </Animated.View>
  );
};
