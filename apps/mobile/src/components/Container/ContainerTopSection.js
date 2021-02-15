import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { Header } from '../Header';

export const ContainerTopSection = ({root}) => {
  const [state] = useTracked();
  const {colors, selectionMode} = state;

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        opacity: selectionMode ? 0 : 1,
        overflow: 'hidden',
        transform: [
          {
            translateY: selectionMode ? -150 : 0,
          },
        ],
      }}>
      <Header root={root} />
    </View>
  );
};
