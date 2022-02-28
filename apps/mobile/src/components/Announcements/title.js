import React from 'react';
import { useTracked } from '../../provider';
import Heading from '../ui/typography/heading';
import { getStyle } from './functions';

export const Title = ({ text, style = {} }) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <Heading
      style={{
        marginHorizontal: 12,
        marginTop: 12,
        ...getStyle(style)
      }}
    >
      {text}
    </Heading>
  );
};
