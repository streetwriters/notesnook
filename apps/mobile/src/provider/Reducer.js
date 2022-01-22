import { Actions } from './Actions';

export const reducer = (state, action) => {
  switch (action.type) {
    case Actions.THEME: {
      return {
        ...state,
        colors: action.colors
      };
    }
    default:
      return state;
    //throw new Error('unknown action type');
  }
};
