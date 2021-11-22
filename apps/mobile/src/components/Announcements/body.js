import React from 'react';
import { useTracked } from '../../provider';
import Paragraph from '../Typography/Paragraph';
import { getStyle } from './functions';


export const Body = ({text, style = {}}) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <Paragraph
      style={{
        paddingHorizontal: 12,
        ...getStyle(style)
      }}>
      {text}
    </Paragraph>
  );
};