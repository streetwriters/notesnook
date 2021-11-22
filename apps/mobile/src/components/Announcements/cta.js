import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { Button } from '../Button';
import { getStyle } from './functions';

export const Cta = ({actions, style = {}}) => {
  const [state] = useTracked();
  const colors = state.colors;
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 12,
        backgroundColor: colors.bg,
        ...getStyle(style)
      }}>
      {actions.map((item, index) => (
        <Button
          type={index === 0 ? 'accent' : 'grayBg'}
          title={item.text}
          width="100%"
          onPress={() => {}}
          style={{
            marginBottom: 10
          }}
        />
      ))}
    </View>
  );
};
