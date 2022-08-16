import React from 'react';
import { useThemeStore } from '../../stores/use-theme-store';
import { SIZE } from '../../utils/size';
import Heading from '../ui/typography/heading';
import { getStyle } from './functions';

export const SubHeading = ({ text, style = {} }) => {
  const colors = useThemeStore(state => state.colors);

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
