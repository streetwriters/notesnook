import React from 'react';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import Paragraph from '../ui/typography/paragraph';
import { getStyle } from './functions';

export const Description = ({ text, style = {} }) => {
  const colors = useThemeStore(state => state.colors);
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
