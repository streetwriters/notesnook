import React from 'react';
import {Text} from 'react-native';
import {useTracked} from '../../provider';
import Heading from '../Typography/Heading';

export const HeaderTitle = () => {
  const [state] = useTracked();
  const {colors, headerTextState} = state;

  return (
    <>
      <Heading color={headerTextState.color}>
        <Text
          style={{
            color: colors.accent,
          }}>
          {headerTextState.heading.slice(0, 1) === '#' ? '#' : null}
        </Text>

        {headerTextState.heading.slice(0, 1) === '#'
          ? headerTextState.heading.slice(1)
          : headerTextState.heading}
      </Heading>
    </>
  );
};
