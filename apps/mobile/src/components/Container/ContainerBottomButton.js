import React, {useEffect, useState} from 'react';
import {Keyboard, Platform, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {getElevation} from '../../utils';
import {PressableButton} from '../PressableButton';
import {pv, SIZE, WEIGHT} from "../../utils/SizeUtils";
import {DDS} from "../../services/DeviceDetection";

export const ContainerBottomButton = ({title, onPress, color}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [buttonHide, setButtonHide] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        if (DDS.isTab) return;
        setButtonHide(true);
      }, 300);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        if (DDS.isTab) return;
        setButtonHide(false);
      }, 0);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setTimeout(() => {
          if (DDS.isTab) return;
          setButtonHide(true);
        }, 300);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          if (DDS.isTab) return;
          setButtonHide(false);
        }, 0);
      });
    };
  }, []);

  return (
    <View
      style={{
        width: '100%',
        opacity: buttonHide ? 0 : 1,
        position: 'absolute',
        paddingHorizontal: 12,
        bottom: Platform.OS === 'ios' ? insets.bottom - 10 : insets.bottom + 20,
        zIndex: 10,
        transform: [
          {
            translateY: buttonHide ? 200 : 0,
          },
        ],
      }}>
      <PressableButton
        testID={'container_bottom_btn'}
        color={color || colors.accent}
        selectedColor={color || colors.accent}
        customStyle={{
          ...getElevation(5),
        }}
        onPress={onPress}>
        <View
          style={{
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            padding: pv,
            borderRadius: 5,
            paddingVertical: pv + 5,
          }}>
          <Icon
            name={title === 'Clear all trash' ? 'delete' : 'plus'}
            color="white"
            size={SIZE.xl}
          />
          <Text
            testID="container_bottom_btn_text"
            style={{
              fontSize: SIZE.md,
              color: 'white',
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
            }}>
            {'  ' + title}
          </Text>
        </View>
      </PressableButton>
    </View>
  );
};
