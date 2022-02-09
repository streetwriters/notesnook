import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { SIZE } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';
import Paragraph from '../Typography/Paragraph';

export const Notice = ({ type, text, size }) => {
  const [state] = useTracked();
  const colors = state.colors;
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
      <ActionIcon
        size={isSmall ? SIZE.xs + 1 : SIZE.xxl}
        name={type}
        customStyle={{
          width: isSmall ? null : 40,
          height: isSmall ? null : 40
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
