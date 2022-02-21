import React from 'react';
import { useTracked } from '../../provider';
import { SIZE } from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import { getStyle } from './functions';

export const SubHeading = ({ text, style = {} }) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <Heading
      size={SIZE.md + 2}
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
