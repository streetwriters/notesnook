import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {COLORS_NOTE} from '../../utils/Colors';
import {SIZE} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

export const MessageCard = ({data}) => {
  const [state] = useTracked();
  const {colors, selectionMode, currentScreen, messageBoardState} = state;

  return (
    <View>
      {!messageBoardState.visible || selectionMode ? null : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={messageBoardState.onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: DDS.isLargeTablet() ? 'relative' : 'absolute',
            right: 0,
            top: 0,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Paragraph
              color={
                COLORS_NOTE[currentScreen]
                  ? COLORS_NOTE[currentScreen]
                  : colors.accent
              }
              style={{
                marginRight: 10,
              }}>
              {messageBoardState.actionText}
            </Paragraph>

            <Icon
              name="arrow-right"
              size={SIZE.sm}
              color={
                COLORS_NOTE[currentScreen]
                  ? COLORS_NOTE[currentScreen]
                  : colors.accent
              }
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
