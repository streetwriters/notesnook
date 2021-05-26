import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {getElevation} from '../../utils';
import {SIZE} from '../../utils/SizeUtils';
import useAnnouncement from '../../utils/useAnnouncement';
import Paragraph from '../Typography/Paragraph';

export const Card = ({data, color, announcement}) => {
  const [state] = useTracked();
  const {selectionMode, messageBoardState} = state;

  return !messageBoardState.visible || selectionMode || announcement ? null : (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={messageBoardState.onPress}
      testID={notesnook.ids.default.loginToSync}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: DDS.isLargeTablet() || announcement ? 'relative' : 'absolute',
        right: 0,
        top: 0,
        zIndex: 100,
        backgroundColor: messageBoardState.type === 'error' ? 'red' : color,
        width: '100%',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 5,
          width: '100%',
        }}>
        <View
          style={{
            borderRadius: 100,
            backgroundColor: 'white',
            marginRight: 5,
            height: 20,
            width: 20,
            justifyContent: 'center',
            alignItems: 'center',
            ...getElevation(5),
          }}>
          <Icon
            name={messageBoardState.icon}
            size={SIZE.sm}
            color={messageBoardState.type === 'error' ? 'red' : color}
          />
        </View>

        <Paragraph size={SIZE.sm} color="white">
          {messageBoardState.actionText}
        </Paragraph>

        <Icon
          name="arrow-right"
          size={SIZE.md}
          color="white"
          style={{
            position: 'absolute',
            right: 12,
          }}
        />
      </View>
    </TouchableOpacity>
  );
};
