import React from 'react';
import { useTracked } from '../../provider';
import Paragraph from '../ui/typography/paragraph';
import { getStyle } from './functions';

export const Body = ({ text, style = {} }) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <Paragraph
      style={{
        paddingHorizontal: 12,
        ...getStyle(style)
      }}
    >
      {text}
    </Paragraph>
  );
};
