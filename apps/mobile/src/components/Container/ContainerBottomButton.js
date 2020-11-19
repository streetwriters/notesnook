import React, {useEffect} from 'react';
import {Keyboard, Platform, View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {getElevation, showContext} from '../../utils';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';

const translateY = new Animated.Value(0);
export const ContainerBottomButton = ({title, onPress, color,shouldShow =false}) => {
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

  return DDS.isLargeTablet() && !shouldShow ? null : (
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
