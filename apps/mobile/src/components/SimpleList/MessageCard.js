import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { COLORS_NOTE } from '../../utils/Colors';
import { SIZE } from '../../utils/SizeUtils';

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
            position: 'absolute',
            right: 0,
            top: 0,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: COLORS_NOTE[currentScreen]
                  ? COLORS_NOTE[currentScreen]
                  : colors.accent,
                fontSize: SIZE.sm,
                marginRight: 10,
              }}>
              {messageBoardState.actionText}
            </Text>

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
