import React from 'react';
import { useThemeStore } from '../../stores/theme';
import Heading from '../ui/typography/heading';
import { getStyle } from './functions';

export const Title = ({ text, style = {} }) => {
  const colors = useThemeStore(state => state.colors);

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
