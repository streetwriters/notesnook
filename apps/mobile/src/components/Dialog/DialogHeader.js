import React from 'react';
import {Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';

const DialogHeader = ({icon, title, paragraph}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {/*   {icon ? (
          <Icon name={icon} color={colors.accent} size={SIZE.lg} />
        ) : null} */}
        <Text
          style={{
            color: colors.heading,
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.xl,
          }}>
          {title}
        </Text>
      </View>

      {paragraph ? (
        <Text
          style={{
            color: colors.icon,
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.sm,
          }}>
          {paragraph}
        </Text>
      ) : null}
    </>
  );
};

export default DialogHeader;
