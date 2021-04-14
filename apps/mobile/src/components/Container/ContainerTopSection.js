import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { Header } from '../Header';

export const ContainerTopSection = ({children}) => {
  const [state] = useTracked();
  const {colors, selectionMode} = state;

  return !selectionMode && (
    <View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        overflow: 'hidden',
      }}>
      {children}
    </View>
  );
};
