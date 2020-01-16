import React, {useReducer} from 'react';
import {DDS, db} from '../../App';
import {createContainer} from 'react-tracked';
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

const reducer = (state, action) => {
  switch (action.type) {
    case 'updateNotes':
      let notes = db.groupNotes();
      console.log('updating notes');
      return {
        ...state,
        notes: notes,
      };

    default:
      throw new Error('unknown action type');
  }
};

const useValue = () => useReducer(reducer, defaultState);

export const {Provider, useTracked} = createContainer(useValue);
