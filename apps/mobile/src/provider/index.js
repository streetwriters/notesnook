import {useReducer} from 'react';
import {createContainer} from 'react-tracked';
import {reducer} from './Reducer';
import {defaultState} from './DefaultState';

const useValue = () => useReducer(reducer, defaultState);

export const {Provider, useTracked, useTrackedState} = createContainer(
  useValue,
);
