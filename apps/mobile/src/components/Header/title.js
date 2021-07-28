import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import Heading from '../Typography/Heading';

export const Title = ({heading, headerColor}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <View
      style={{
        opacity: 1,
        flexShrink: 1,
        flexDirection: 'row'
      }}>
      <Heading
        numberOfLines={1}
        style={{
          flexWrap: 'wrap'
        }}
        color={headerColor}>
        <Heading color={colors.accent}>
          {heading.slice(0, 1) === '#' ? '#' : null}
        </Heading>
        {heading.slice(0, 1) === '#' ? heading.slice(1) : heading}
      </Heading>
    </View>
  );
};
