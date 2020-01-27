import {db} from '../../App';
import {SideMenuEvent} from '../utils/utils';
import {ACTIONS} from './actions';

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.NOTES:
      let notes = db.groupNotes();
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
    case ACTIONS.NOTEBOOKS: {
      let notebooks = [...db.getNotebooks()];
      return {
        ...state,
        notebooks: notebooks,
      };
    }
    case ACTIONS.TRASH: {
      let trash = [...db.getTrash()];

      return {
        ...state,
        trash: trash,
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
      console.log(action.item, selectedItems);
      return {
        ...state,
        selectedItemsList: selectedItems,
      };
    }
    case ACTIONS.CLEAR_SELECTION: {
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
        currentEditingNote: action.dateCreated,
      };
    }
    default:
      throw new Error('unknown action type');
  }
};
