import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {COLORS_NOTE} from '../../utils/Colors';
import {SIZE} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

export const MessageCard = ({data,color}) => {
  const [state] = useTracked();
  const {colors, selectionMode,  messageBoardState,headerTextState} = state;

  return (
    <View>
      {!messageBoardState.visible || selectionMode ? null : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={messageBoardState.onPress}
          testID={notesnook.ids.default.loginToSync}
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
              color={color}
              style={{
                marginRight: 10,
              }}>
              {messageBoardState.actionText}
            </Paragraph>

            <Icon
              name="arrow-right"
              size={SIZE.sm}
              color={color}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
