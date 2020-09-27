import React from 'react';
import {Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';

const DialogHeader = ({icon, title}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {icon ? <Icon name={icon} color={colors.accent} size={SIZE.lg} /> : null}
      <Text
        style={{
          color: colors.accent,
          fontFamily: WEIGHT.bold,
          marginLeft: 5,
          fontSize: SIZE.md,
        }}>
        {title}
      </Text>
    </View>
  );
};

export default DialogHeader
