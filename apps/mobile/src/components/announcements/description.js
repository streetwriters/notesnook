import React from 'react';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import Paragraph from '../ui/typography/paragraph';
import { getStyle } from './functions';

export const Description = ({ text, style = {}, inline }) => {
  const colors = useThemeStore(state => state.colors);
  return (
    <Paragraph
      style={{
        marginHorizontal: 12,
        ...getStyle(style),
        textAlign: inline ? 'left' : style?.textAlign
      }}
      size={inline ? SIZE.sm : SIZE.md}
    >
      {text}
    </Paragraph>
  );
};
