import React from 'react';
import {Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SIZE, WEIGHT } from '../../common/common';
import {useTracked} from '../../provider';

const DialogHeader = ({icon, title, paragraph}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {icon ? (
          <Icon name={icon} color={colors.accent} size={SIZE.lg} />
        ) : null}
        <Text
          style={{
            color: colors.heading,
            fontFamily: WEIGHT.bold,
            marginLeft: 5,
            fontSize: SIZE.lg,
          }}>
          {title}
        </Text>
      </View>
      {paragraph ? (
        <Text
          style={{
            color: colors.icon,
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.xs + 1,
            textAlign: 'center',
          }}>
          {paragraph}
        </Text>
      ) : null}
    </>
  );
};

export default DialogHeader;
