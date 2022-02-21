import { useReducer } from 'react';
import { createContainer } from 'react-tracked';
import { defaultState } from './DefaultState';
import { reducer } from './Reducer';

export type TrackedState = typeof defaultState;

const useValue: () => [TrackedState, React.DispatchWithoutAction] = () =>
  useReducer(reducer, defaultState);

export const { Provider, useTracked, useTrackedState } = createContainer(useValue);
