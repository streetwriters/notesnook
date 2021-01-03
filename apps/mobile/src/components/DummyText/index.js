import React, {createRef} from 'react';
import {Text} from 'react-native';
import {SIZE} from '../../utils/SizeUtils';

export const dummyRef = createRef();

export const DummyText = () => {
  return (
    <Text
      ref={dummyRef}
      style={[
        {
          //fontFamily: "sans-serif",
          fontSize: SIZE.sm,
          position: 'absolute',
          right: -1000,
          top: -1000,
        },
      ]}>
      a
    </Text>
  );
};
