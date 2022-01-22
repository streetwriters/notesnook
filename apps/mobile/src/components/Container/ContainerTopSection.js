import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { useSelectionStore } from '../../provider/stores';

export const ContainerTopSection = ({ children }) => {
  const [state] = useTracked();
  const { colors } = state;
  const selectionMode = useSelectionStore(state => state.selectionMode);

  return !selectionMode ? (
    <View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {children}
    </View>
  ) : null;
};
