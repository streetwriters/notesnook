import React from 'react';
import { useThemeStore } from '../../stores/theme';
import Paragraph from '../ui/typography/paragraph';
import { getStyle } from './functions';

export const Body = ({ text, style = {} }) => {
  const colors = useThemeStore(state => state.colors);

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
