import React, { useEffect } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import { useSelectionStore, useSettingStore } from '../../provider/stores';
import { editing, getElevation, showTooltip, TOOLTIP_POSITIONS } from '../../utils';
import { normalize, SIZE } from '../../utils/size';
import { PressableButton } from '../ui/pressable';

const translateY = new Animated.Value(0);
export const FloatingButton = ({ title, onPress, color = 'accent', shouldShow = false }) => {
  const insets = useSafeAreaInsets();
  const deviceMode = useSettingStore(state => state.deviceMode);
  const selectionMode = useSelectionStore(state => state.selectionMode);

  useEffect(() => {
    animate(selectionMode ? 150 : 0);
  }, [selectionMode]);

  function animate(translate) {
    Animated.timing(translateY, {
      toValue: translate,
      duration: 250,
      easing: Easing.elastic(1)
    }).start();
  }

  const onKeyboardHide = async () => {
    editing.keyboardState = false;
    if (deviceMode !== 'mobile') return;
    animate(0);
  };

  const onKeyboardShow = async () => {
    editing.keyboardState = true;
    if (deviceMode !== 'mobile') return;
    animate(150);
  };

  useEffect(() => {
    let sub1 = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    let sub2 = Keyboard.addListener('keyboardDidHide', onKeyboardHide);
    return () => {
      sub1?.remove();
      sub2?.remove();
    };
  }, [deviceMode]);

  return deviceMode !== 'mobile' && !shouldShow ? null : (
    <Animated.View
      style={{
        position: 'absolute',
        right: 12,
        bottom:
          Platform.OS === 'ios' && insets.bottom !== 0
            ? Platform.isPad
              ? insets.bottom - 12
              : insets.bottom - 24
            : insets.bottom + 12,
        zIndex: 10,
        transform: [
          {
            translateY: translateY
          },
          {
            translateX: translateY
          }
        ]
      }}
    >
      <PressableButton
        testID={notesnook.buttons.add}
        type="accent"
        accentColor={color || 'accent'}
        accentText="light"
        customStyle={{
          ...getElevation(5),
          borderRadius: 100
        }}
        onLongPress={event => {
          showTooltip(event, title, TOOLTIP_POSITIONS.LEFT);
        }}
        onPress={onPress}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: normalize(60),
            width: normalize(60)
          }}
        >
          <Icon
            name={title === 'Clear all trash' ? 'delete' : 'plus'}
            color="white"
            size={SIZE.xxl}
          />
        </View>
      </PressableButton>
    </Animated.View>
  );
};
