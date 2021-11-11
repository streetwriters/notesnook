import React from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import Paragraph from '../Typography/Paragraph';

export const ProTag = ({width, size, background}) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <View
      style={{
        backgroundColor: background || colors.bg,
        borderRadius: 100,
        width:width || 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 2.5,
        flexDirection: 'row'
      }}>
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
