import React from 'react';
import * as Animatable from 'react-native-animatable';
import {useTracked} from '../../provider';
import {Header} from '../header';
import {Search} from '../SearchInput';

export const ContainerTopSection = ({root}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;

  return (
    <Animatable.View
      transition="backgroundColor"
      duration={300}
      style={{
        position: selectionMode ? 'relative' : 'absolute',
        backgroundColor: colors.bg,
        zIndex: 999,
        display: selectionMode ? 'none' : 'flex',
        width: '100%',
      }}>
      <Header root={root} />

      <Search root={root} />
    </Animatable.View>
  );
};
