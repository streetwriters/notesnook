import {useContext} from 'react';
import {AppContext} from '.';

const useAppContext = () => {
  const [state, dispatch] = useContext(AppContext);

  if (dispatch === undefined) {
    throw new Error('Must have dispatch defined');
  }

  function logInUser(isLoggedIn) {
    dispatch(draft => {
      draft.userLoggedIn = true;
    });
  }

  return {
    ...state,
    logInUser,
  };
};

export {useAppContext};
