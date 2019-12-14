import React, {createContext} from 'react';
import {useImmer} from 'use-immer';

const AppContext = createContext();

const defaultState = {
  userLoggedIn: false,
};

const AppProvider = ({children}) => {
  const [state, dispatch] = useImmer({...defaultState});

  return (
    <AppContext.Provider value={[state, dispatch]}>
      {children}
    </AppContext.Provider>
  );
};

export {AppContext, AppProvider};
