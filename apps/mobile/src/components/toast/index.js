import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import { DDS } from '../../services/device-detection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/theme';
import { getElevation } from '../../utils';
import { eHideToast, eShowToast } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { Button } from '../ui/button';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
let toastMessages = [];
export const Toast = ({ context = 'global' }) => {
  const colors = useThemeStore(state => state.colors);
  const [keyboard, setKeyboard] = useState(false);
  const [data, setData] = useState({});
  const insets = useSafeAreaInsets();
  const hideTimeout = useRef();
  const [visible, setVisible] = useState(false);

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

    setVisible(true);
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
      setVisible(false);
      showNext(msg);
      setTimeout(() => {
        setVisible(true);
      }, 300);
    } else {
      setVisible(false);
      toastMessages.shift();
      setTimeout(() => {
        setData({});
        if (hideTimeout.current) {
          clearTimeout(hideTimeout.current);
        }
      }, 100);
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
    visible && (
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
          elevation: 15
        }}
      >
        <Animated.View
          entering={FadeInUp.springify()}
          exiting={FadeOutUp}
          style={{
            ...getElevation(5),
            maxWidth: '95%',
            backgroundColor: colors.nav,
            minWidth: data?.func ? '95%' : '50%',
            alignSelf: 'center',
            borderRadius: 5,
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
    )
  );
};
