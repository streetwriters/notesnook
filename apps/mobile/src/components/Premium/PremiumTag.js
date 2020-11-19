import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { SIZE } from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

export const PremiumTag = ({pro}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return !pro ? (
    <View
      style={{
        backgroundColor: colors.accent,
        paddingVertical: 5,
        alignItems: 'center',
        borderRadius: 5,
        marginRight: 20,
        elevation: 1,
      }}>
      <Paragraph
        size={SIZE.xs}
        style={{
          color: 'white',
          paddingHorizontal: 4,
        }}>
        PRO
      </Paragraph>
    </View>
  ) : null;
};
