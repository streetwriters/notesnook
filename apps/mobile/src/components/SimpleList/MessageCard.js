import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { SIZE } from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

export const MessageCard = ({data, color}) => {
  const [state] = useTracked();
  const {selectionMode, messageBoardState} = state;

  return !messageBoardState.visible || selectionMode ? null : (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={messageBoardState.onPress}
      testID={notesnook.ids.default.loginToSync}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: DDS.isLargeTablet() ? 'relative' : 'absolute',
        right: 10,
        top: 10,
        zIndex:999
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Paragraph
          color={color}
          style={{
            marginRight: 10,
          }}>
          {messageBoardState.actionText}
        </Paragraph>

        <Icon name="arrow-right" size={SIZE.sm} color={color} />
      </View>
    </TouchableOpacity>
  );
};
