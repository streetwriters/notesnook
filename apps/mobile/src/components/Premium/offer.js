import React from 'react';
import {Text} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

export const Offer = ({
  off = '30',
  text = 'on yearly plan, offer ends soon',
  padding = 0
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <Paragraph
      style={{
        textAlign: 'center',
        paddingVertical: padding
      }}
      size={SIZE.xxxl}>
      GET {off}
      <Text style={{color: colors.accent}}>%</Text> OFF!{'\n'}
      <Paragraph color={colors.icon}>{text}</Paragraph>
    </Paragraph>
  );
};
