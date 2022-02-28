import React from 'react';
import { useTracked } from '../../provider';
import { SIZE } from '../../utils/size';
import Paragraph from '../ui/typography/paragraph';
import { getStyle } from './functions';

export const Description = ({ text, style = {} }) => {
  const [state] = useTracked();
  const colors = state.colors;
  return (
    <Paragraph
      size={SIZE.md}
      style={{
        marginHorizontal: 12,
        ...getStyle(style)
      }}
    >
      {text}
    </Paragraph>
  );
};
