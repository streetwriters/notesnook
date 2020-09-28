import React, {useEffect, useState} from 'react';
import {Keyboard, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {DDS, getElevation} from '../../utils/utils';
import {PressableButton} from '../PressableButton';

export const ContainerBottomButton = ({root}) => {
  const [state, dispatch] = useTracked();
  const {colors,containerBottomButton} = state;
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

  return !containerBottomButton.visible ? null : (
    <View
      style={{
        width: '100%',
        opacity: buttonHide ? 0 : 1,
        position: 'absolute',
        paddingHorizontal: 12,
        bottom: insets.bottom + 20,
        zIndex: 10,
        transform: [
          {
            translateY: buttonHide ? 200 : 0,
          },
        ],
      }}>
      <PressableButton
        testID={"container_bottom_btn"}
        color={
          containerBottomButton.color
            ? containerBottomButton.color
            : colors.accent
        }
        selectedColor={
          containerBottomButton.color
            ? containerBottomButton.color
            : colors.accent
        }
        customStyle={{
          ...getElevation(5),
        }}
        onPress={containerBottomButton.bottomButtonOnPress}>
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
            name={
              containerBottomButton.bottomButtonText === 'Clear all trash'
                ? 'delete'
                : 'plus'
            }
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
            {'  ' + containerBottomButton.bottomButtonText}
          </Text>
        </View>
      </PressableButton>
    </View>
  );
};
