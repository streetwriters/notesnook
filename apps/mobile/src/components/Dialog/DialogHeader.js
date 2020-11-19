import React from 'react';
import {Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

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
        <Heading size={SIZE.xl}>{title}</Heading>
      </View>

      {paragraph ? (
        <Paragraph color={colors.icon}>{paragraph}</Paragraph>
      ) : null}
    </>
  );
};

export default DialogHeader;
