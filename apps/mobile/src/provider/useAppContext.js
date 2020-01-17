import {useContext} from 'react';
import {AppContext, useTrackedState} from '.';
import {StatusBar} from 'react-native';
import {
  COLOR_SCHEME,
  setColorScheme,
  getColorScheme,
  ACCENT,
} from '../common/common';
import {db} from '../../App';

const useAppContext = () => {
  const state = useTrackedState();
  /* 
  // Themeing

  async function updateAppTheme(colors = state.colors) {
    let newColors = await getColorScheme(colors);
    dispatch(draft => {
      draft.colors = {...newColors};
    });
  }

  function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
    let newColors = setColorScheme(colors, accent);
    StatusBar.setBarStyle(newColors.night ? 'light-content' : 'dark-content');

    dispatch(draft => {
      draft.colors = {...newColors};
    });
  }

  function changeAccentColor(accentColor) {
    ACCENT.color = accentColor;
    ACCENT.shade = accentColor + '12';
    changeColorScheme();
  }

  // Handling Selection Items

  function changeSelectionMode(enabled) {
    dispatch(draft => {
      draft.selectionMode = enabled;
      if (!enabled) {
        draft.selectedItemsList = [...[]];
      }
    });
  }
  function updateSelectionList(item) {
    let selectedItems = [...state.selectedItemsList];

    if (selectedItems.includes(item)) {
      selectedItems.splice(selectedItems.indexOf(item), 1);
    } else {
      selectedItems.push(item);
    }

    dispatch(draft => {
      draft.selectedItemsList = selectedItems;
    });
  }

  // Database Control

  function updateDB() {
    let notes = db.groupNotes();
    let notebooks = db.getNotebooks();
    let trash = db.getTrash();
    let favorites = db.getFavorites();
    let pinned = db.getPinned();

    dispatch(draft => {
      draft.notes = notes;
      draft.notebooks = notebooks;
      draft.trash = trash;
      draft.favorites = favorites;
      draft.pinned = pinned;
    });
  } */

  return {
    ...state,
  };
};

export {useAppContext};
