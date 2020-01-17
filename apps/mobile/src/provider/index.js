import React, {createContext, useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {useImmer} from 'use-immer';
import {DDS, db} from '../../App';
import {getColorScheme} from '../common/common';

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
  selectionMode: false,
  selectedItemsList: [],
};

<<<<<<< HEAD
export const ACTIONS = {
  NOTES: 'note',
  NOTEBOOKS: 'notebook',
  TRASH: 'trash',
  TAGS: 'tags',
  PINNED: 'pinned',
  FAVORITES: 'favorites',
  SELECTION_MODE: 'selectionMode',
  SELECTED_ITEMS_LIST: 'selectedItemsList',
  THEME: 'theme',
  CHANGE_THEME: 'changeTheme',
  CHANGE_ACCENT: 'changeAccent',
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.NOTES:
      console.log(action.payload);
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
    default:
      throw new Error('unknown action type');
=======
const AppContext = createContext([defaultState, function() {}]);

const AppProvider = ({children}) => {
  const [state, dispatch] = useImmer({...defaultState});
  const [loading, setLoading] = useState(true);

  async function init() {
    let newColors = await getColorScheme();
    dispatch(draft => {
      draft.colors = {...newColors};
      draft.notes = db.groupNotes();
      draft.notebooks = db.getNotebooks();
      draft.trash = db.getTrash();
      draft.favorites = db.getFavorites();
      draft.pinned = db.getPinned();
    });
    setLoading(false);
>>>>>>> cfee96fb230bdd33c710a5e72a80ccf2b82a8646
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <AppContext.Provider value={[state, dispatch]}>
      {loading ? (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text>Loading...</Text>
        </View>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};

export {AppProvider, AppContext};
