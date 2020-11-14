import React, {useEffect, useState} from 'react';
import {Keyboard, Platform, Text, UIManager, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {getElevation, showContext} from '../../utils';
import {PressableButton} from '../PressableButton';
import {normalize, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {DDS} from '../../services/DeviceDetection';
import {sleep} from '../../utils/TimeUtils';
import Animated, {Easing} from 'react-native-reanimated';

const translateY = new Animated.Value(0);
export const ContainerBottomButton = ({title, onPress, color}) => {
  const [state] = useTracked();
  const {colors} = state;
  const insets = useSafeAreaInsets();

  function animate(translate) {
    Animated.timing(translateY, {
      toValue: translate,
      duration: 250,
      easing: Easing.elastic(1),
    }).start();
  }

  const onKeyboardHide = async () => {
    if (DDS.isTab) return;
    animate(0);
  };

  const onKeyboardShow = async () => {
    if (DDS.isTab) return;
    animate(150);
  };

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    Keyboard.addListener('keyboardDidHide', onKeyboardHide);
    return () => {
      Keyboard.removeListener('keyboardDidShow', onKeyboardShow);
      Keyboard.removeListener('keyboardDidHide', onKeyboardHide);
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        right: 12,
        bottom: Platform.OS === 'ios' ? insets.bottom - 10 : insets.bottom + 12,
        zIndex: 10,
        transform: [
          {
            translateY: translateY,
          },
          {
            translateX: translateY,
          },
        ],
      }}>
      <PressableButton
        testID={'container_bottom_btn'}
        color={color || colors.accent}
        selectedColor={color || colors.accent}
        customStyle={{
          ...getElevation(5),
          borderRadius: 100,
        }}
        onLongPress={(event) => {
          console.log(event);
          showContext(event, title);
        }}
        onPress={onPress}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: normalize(60),
            width: normalize(60),
          }}>
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
