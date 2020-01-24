import {useReducer} from 'react';
import {createContainer} from 'react-tracked';
import {reducer} from './reducer';
import {defaultState} from './defaultState';

const useValue = () => useReducer(reducer, defaultState);

export const {Provider, useTracked, useTrackedState} = createContainer(
  useValue,
);
