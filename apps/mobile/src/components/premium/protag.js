import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../stores/use-theme-store';
import Paragraph from '../ui/typography/paragraph';

export const ProTag = ({ width, size, background }) => {
  const colors = useThemeStore(state => state.colors);

  return (
    <View
      style={{
        backgroundColor: background || colors.bg,
        borderRadius: 100,
        width: width || 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 2.5,
        flexDirection: 'row'
      }}
    >
      <Icon
        style={{
          marginRight: 3
        }}
        size={size}
        color={colors.accent}
        name="crown"
      />
      <Paragraph size={size - 1.5} color={colors.accent}>
        PRO
      </Paragraph>
    </View>
  );
};
