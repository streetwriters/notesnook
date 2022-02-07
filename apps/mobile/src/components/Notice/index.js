import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { ActionIcon } from '../ActionIcon';
import Paragraph from '../Typography/Paragraph';

export const Notice = ({ type, text }) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <View
      style={{
        padding: 12,
        flexDirection: 'row',
        backgroundColor: colors.nav,
        borderRadius: 10
      }}
    >
      <ActionIcon name={type} color={type === 'alert' ? colors.errorText : colors.icon} />
      <Paragraph
        style={{
          marginLeft: 10,
          flexShrink: 1
        }}
      >
        {text}
      </Paragraph>
    </View>
  );
};
