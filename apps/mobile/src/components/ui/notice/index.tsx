import React from 'react';
import { View } from 'react-native';
import { useThemeStore } from '../../../stores/theme';
import { SIZE } from '../../../utils/size';
import { IconButton } from '../icon-button';
import Paragraph from '../typography/paragraph';

export interface NoticeProps {
  type?: 'alert' | 'information';
  text: string;
  size?: 'small' | 'large';
}

export const Notice = ({ type = 'alert', text, size = 'large' }: NoticeProps) => {
  const colors = useThemeStore(state => state.colors);
  const isSmall = size === 'small';

  return (
    <View
      style={{
        padding: 12,
        flexDirection: 'row',
        backgroundColor: colors.nav,
        borderRadius: isSmall ? 5 : 10
      }}
    >
      <IconButton
        size={isSmall ? SIZE.lg + 1 : SIZE.xxl}
        name={type}
        customStyle={{
          width: isSmall ? undefined : 40,
          height: isSmall ? undefined : 40
        }}
        color={type === 'alert' ? colors.errorText : colors.accent}
      />
      <Paragraph
        style={{
          marginLeft: 10,
          flexShrink: 1
        }}
        size={isSmall ? SIZE.xs + 1 : SIZE.sm}
      >
        {text}
      </Paragraph>
    </View>
  );
};
