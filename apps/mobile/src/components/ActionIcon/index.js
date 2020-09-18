import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE} from '../../common/common';

export const ActionIcon = ({onPress, name, color, customStyle}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          width: 50,
          height: 40,
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingRight: 12,
          zIndex: 800,
        },
        customStyle,
      ]}>
      <Icon name={name} color={color} size={SIZE.xxxl} />
    </TouchableOpacity>
  );
};
