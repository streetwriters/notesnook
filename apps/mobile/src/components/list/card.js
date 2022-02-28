import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../stores/theme';
import { useMessageStore, useSelectionStore } from '../../stores/stores';
import { hexToRGBA } from '../../utils/color-scheme/utils';
import { SIZE } from '../../utils/size';
import { PressableButton } from '../ui/pressable';
import Paragraph from '../ui/typography/paragraph';

export const Card = ({ color }) => {
  const colors = useThemeStore(state => state.colors);
  color = color ? color : colors.accent;

  const selectionMode = useSelectionStore(state => state.selectionMode);
  const messageBoardState = useMessageStore(state => state.message);
  const announcement = useMessageStore(state => state.announcement);

  return !messageBoardState.visible || selectionMode || announcement ? null : (
    <PressableButton
      onPress={messageBoardState.onPress}
      type="gray"
      customStyle={{
        paddingVertical: 12,
        width: '95%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 0
      }}
    >
      <View
        style={{
          width: 40,
          backgroundColor:
            messageBoardState.type === 'error'
              ? hexToRGBA(colors.red, 0.15)
              : hexToRGBA(color, 0.15),
          height: 40,
          marginLeft: 10,
          borderRadius: 100,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon
          size={SIZE.lg}
          color={messageBoardState.type === 'error' ? colors.errorText : color}
          name={messageBoardState.icon}
        />
      </View>

      <View
        style={{
          marginLeft: 10,
          maxWidth: '70%'
        }}
      >
        <Paragraph color={colors.icon} size={SIZE.xs}>
          {messageBoardState.message}
        </Paragraph>
        <Paragraph
          style={{
            maxWidth: '100%'
          }}
          color={colors.heading}
        >
          {messageBoardState.actionText}
        </Paragraph>
      </View>

      <View
        style={{
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: 6
        }}
      >
        <Icon
          name="chevron-right"
          color={messageBoardState.type === 'error' ? colors.red : color}
          size={SIZE.lg}
        />
      </View>
    </PressableButton>
  );
};
