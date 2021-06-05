import { useReducer } from 'react';
import { createContainer } from 'react-tracked';
import { defaultState } from './DefaultState';
import { reducer } from './Reducer';

const useValue = () => useReducer(reducer, defaultState);
export const {Provider, useTracked, useTrackedState} = createContainer(
  useValue,
);