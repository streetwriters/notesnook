import React, {createContext, useEffect} from 'react';
import {useImmer} from 'use-immer';
import {COLOR_SCHEME, getColorScheme} from '../common/common';
const ACCENT = {
  color: '#0560FF',
};

const defaultState = {
  userLoggedIn: false,
  colors: {
    night: false,
    bg: 'white',
    fg: ACCENT.color,
    navbg: '#f6fbfc',
    nav: '#f0f0f0',
    pri: 'black',
    sec: 'white',
    accent: ACCENT.color,
    normal: 'black',
    icon: 'gray',
    errorBg: '#FFD2D2',
    errorText: '#D8000C',
    successBg: '#DFF2BF',
    successText: '#4F8A10',
    warningBg: '#FEEFB3',
    warningText: '#9F6000',
  },
};

const AppContext = createContext([defaultState, function() {}]);

const AppProvider = ({children}) => {
  const [state, dispatch] = useImmer({...defaultState});

  return (
    <AppContext.Provider value={[state, dispatch]}>
      {children}
    </AppContext.Provider>
  );
};

export {AppContext, AppProvider};
