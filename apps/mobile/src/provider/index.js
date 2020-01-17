import React, {useReducer} from 'react';
import {DDS, db} from '../../App';
import {createContainer} from 'react-tracked';
import {SideMenuEvent} from '../utils/utils';
const defaultState = {
  isMenuOpen: {
    current: false,
  },
  selectionMode: false,
  selectedItemsList: [],
  notes: [],
  notebooks: [],
  trash: [],
  favorites: [],
  pinned: [],
  tags: [],
  colors: {
    night: false,
    bg: 'white',
    fg: '#0560FF',
    navbg: '#f6fbfc',
    nav: '#f0f0f0',
    pri: 'black',
    sec: 'white',
    accent: '#0560FF',
    shade: '#0560FF12',
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

export const ACTIONS = {
  NOTES: 'note',
  NOTEBOOKS: 'notebook',
  TRASH: 'trash',
  TAGS: 'tags',
  PINNED: 'pinned',
  FAVORITES: 'favorites',
  SELECTION_MODE: 'selectionMode',
  SELECTED_ITEMS: 'selectedItemsList',
  THEME: 'theme',
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.NOTES:
      let notes = db.groupNotes();
      return {
        ...state,
        notes: notes,
      };
    case ACTIONS.THEME: {
      return {
        ...state,
        colors: {...action.colors},
      };
    }
    case ACTIONS.NOTEBOOKS: {
      let notebooks = [...db.getNotebooks()];
      return {
        ...state,
        notebooks: notebooks,
      };
    }
    case ACTIONS.PINNED: {
      let pinned = [...db.getPinned()];
      return {
        ...state,
        pinned: pinned,
      };
    }
    case ACTIONS.TAGS: {
      return {
        ...state,
      };
    }
    case ACTIONS.FAVORITES: {
      let favorites = [...db.getFavorites()];

      return {
        ...state,
        favorites: [...favorites],
      };
    }
    case ACTIONS.SELECTION_MODE: {
      if (action.enabled) {
        SideMenuEvent.disable();
      } else {
        SideMenuEvent.enable();
      }

      return {
        ...state,
        selectionMode: action.enabled,
        selectedItemsList: [],
      };
    }
    case ACTIONS.SELECTED_ITEMS: {
      let selectedItems = [...state.selectedItemsList];
      if (selectedItems.includes(action.item)) {
        selectedItems.splice(selectedItems.indexOf(action.item), 1);
      } else {
        selectedItems.push(action.item);
      }
      return {
        ...state,
        selectedItemsList: selectedItems,
      };
    }
    default:
      throw new Error('unknown action type');
  }
};

const useValue = () => useReducer(reducer, defaultState);

export const {Provider, useTracked, useTrackedState} = createContainer(
  useValue,
);
