import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

export const SvgView = ({
  width = 250,
  height = 250,
  src
}: {
  width: number | string;
  height: number | number;
  src: string;
}) => {
  return (
    <View
      style={{
        height: width || 250,
        width: height || 250
      }}
    >
      <SvgXml xml={src} width="100%" height="100%" />
    </View>
  );
};
