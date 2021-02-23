import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { getElevation } from '../../utils';

const DialogContainer = ({width, height, ...restProps}) => {
  const [state,] = useTracked();
  const colors = state.colors;

  return (
    <View
      {...restProps}
      style={{
        ...getElevation(5),
        width: width || DDS.isTab ? 400 : '85%',
        maxHeight: height || 350,
        borderRadius: 5,
        backgroundColor: colors.bg,
        paddingHorizontal: 12,
        paddingVertical: 15,
      }}
    />
  );
};

export default DialogContainer;
