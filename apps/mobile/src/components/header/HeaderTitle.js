import React, {createRef, useEffect} from 'react';
import {Text} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';

export const HeaderTitle = ({root}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  let headerTextState = root ? state.headerTextState : state.indHeaderTextState;

  return (
    <Text
      style={{
        fontSize: SIZE.xl,
        color: headerTextState.color ? headerTextState.color : colors.pri,
        fontFamily: WEIGHT.bold,
      
      }}>
      <Text
        style={{
          color: colors.accent,
        }}>
        {headerTextState.heading.slice(0, 1) === '#' ? '#' : null}
      </Text>

      {headerTextState.heading.slice(0, 1) === '#'
        ? headerTextState.heading.slice(1)
        : headerTextState.heading}
    </Text>
  );
};
