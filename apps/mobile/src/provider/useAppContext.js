import {useContext} from 'react';
import {AppContext} from '.';
import {StatusBar} from 'react-native';
import {
  COLOR_SCHEME,
  setColorScheme,
  getColorScheme,
  ACCENT,
} from '../common/common';

const useAppContext = () => {
  const [state, dispatch] = useContext(AppContext);

  if (dispatch === undefined) {
    throw new Error('Must have dispatch defined');
  }

  async function updateAppTheme(colors = state.colors) {
    let newColors = await getColorScheme(colors);
    dispatch(draft => {
      draft.colors = {...newColors};
    });
  }

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT.color) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(newColors.night ? 'light-content' : 'dark-content');

    dispatch(draft => {
      draft.colors = {...newColors};
    });
  }

  function changeAccentColor(accentColor) {
    ACCENT.color = accentColor;
    changeColorScheme();
  }

  return {
    ...state,
    updateAppTheme,
    changeColorScheme,
    changeAccentColor,
  };
};

export {useAppContext};
