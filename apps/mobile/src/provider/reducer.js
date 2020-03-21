import {history, db} from '../utils/utils';
import {ACTIONS} from './actions';
import {sideMenuRef} from '../utils/refs';

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ALL: {
      let notes = db.notes.pinned;
      let notebooks = db.notebooks.pinned;
      return {
        ...state,
        notes: db.notes.group(),
        user: action.user,
        notebooks: db.notebooks.all,
        trash: db.trash.all,
        pinned: {
          notes,
          notebooks,
        },
        tags: db.tags.all,
        favorites: db.notes.favorites,
        colorNotes: db.colors.all,
      };
    }
    case ACTIONS.NOTES:
      let notes;
      if (action.sort) {
        notes = db.notes.group(action.sort);
      } else {
        notes = db.notes.group();
      }

      return {
        ...state,
        notes: notes,
        loading: false,
      };
    case ACTIONS.THEME: {
      return {
        ...state,
        colors: {...action.colors},
      };
    }
    case ACTIONS.USER: {
      let user = action.user;
      return {
        ...state,
        user: user,
      };
    }
    case ACTIONS.NOTEBOOKS: {
      return {
        ...state,
        notebooks: db.notebooks.all,
      };
    }
    case ACTIONS.SETTINGS: {
      return {
        ...state,
        settings: {...action.settings},
      };
    }
    case ACTIONS.TRASH: {
      return {
        ...state,
        trash: db.trash.all,
      };
    }
    case ACTIONS.PINNED: {
      let notes = db.notes.pinned;
      let notebooks = db.notebooks.pinned;

      return {
        ...state,
        pinned: {
          notes,
          notebooks,
        },
      };
    }
    case ACTIONS.CURRENT_SCREEN: {
      return {
        ...state,
        currentScreen: action.screen,
      };
    }
    case ACTIONS.TAGS: {
      return {
        ...state,
        tags: db.tags.all,
      };
    }
    case ACTIONS.FAVORITES: {
      return {
        ...state,
        favorites: db.notes.favorites,
      };
    }
    case ACTIONS.COLORS: {
      return {
        ...state,
        colorNotes: db.colors.all,
      };
    }
    case ACTIONS.SELECTION_MODE: {
      if (action.enabled) {
        sideMenuRef.current?.setGestureEnabled(false);
      } else {
        sideMenuRef.current?.setGestureEnabled(true);
      }

      return {
        ...state,
        selectionMode: action.enabled,
      };
    }
    case ACTIONS.SELECT_ALL: {
      console.log(action.selected);

      return {
        ...state,
        selectedItemsList: action.selected,
      };
    }
    case ACTIONS.SELECTED_ITEMS: {
      let selectedItems = [...state.selectedItemsList];
      if (selectedItems.includes(action.item)) {
        selectedItems.splice(selectedItems.indexOf(action.item), 1);
      } else {
        selectedItems.push(action.item);
      }
      history.selectedItemsList = selectedItems;
      if (selectedItems.length === 0) {
        sideMenuRef.current?.setGestureEnabled(true);
      }
      return {
        ...state,
        selectedItemsList: selectedItems,
        selectionMode: selectedItems.length > 0 ? state.selectionMode : false,
      };
    }
    case ACTIONS.CLEAR_SELECTION: {
      history.selectedItemsList = [];
      sideMenuRef.current?.setGestureEnabled(true);
      return {
        ...state,
        selectedItemsList: [],
      };
    }
    case ACTIONS.MODAL_NAVIGATOR: {
      return {
        ...state,
        preventDefaultMargins: action.enabled,
      };
    }
    case ACTIONS.LOGIN_NAVIGATOR: {
      return {
        ...state,
        isLoginNavigator: action.enabled,
      };
    }
    case ACTIONS.CURRENT_EDITING_NOTE: {
      return {
        ...state,
        currentEditingNote: action.id,
      };
    }
    case ACTIONS.SEARCH_RESULTS: {
      let results = action.results;
      return {
        ...state,
        searchResults: {...results},
      };
    }
    default:
      throw new Error('unknown action type');
  }
};
