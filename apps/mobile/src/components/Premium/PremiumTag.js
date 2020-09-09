import React from 'react';
import {Text, View} from 'react-native';
import {WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';

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
      <Text
        style={{
          color: 'white',
          paddingHorizontal: 4,
          fontSize: 10,
          fontFamily: WEIGHT.regular,
        }}>
        PRO
      </Text>
    </View>
  ) : null;
};
