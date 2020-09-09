import React from 'react';
import { View} from 'react-native';

const Seperator = ({half = false}) => {
  return (
    <View
      style={{
        width: half ? 10 : 20,
        height: half ? 10 : 20,
      }}
    />
  );
};

export default Seperator