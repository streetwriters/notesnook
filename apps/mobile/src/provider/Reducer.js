import {eSendEvent} from '../services/EventManager';
import {eCloseSideMenu, eOpenSideMenu} from '../utils/Events';
import storage from '../utils/storage';
import {history, SORT, sortSettings} from '../utils/index';
import {Actions} from './Actions';
import {db} from '../utils/DB';
import {defaultState} from './DefaultState';

export const reducer = (state, action) => {
  switch (action.type) {
    case Actions.ALL: {
      return {
        ...state,
        notes: db.notes.group(SORT[sortSettings.sort]),
        notebooks: db.notebooks.all,
        trash: db.trash.all,
        tags: db.tags.all,
        favorites: db.notes.favorites,
        colorNotes: db.colors.all,
      };
    }
    case Actions.SYNCING: {
      return {
        ...state,
        syncing: action.syncing,
      };
    }
    case Actions.LOADING: {
      return {
        ...state,
        loading: action.loading,
      };
    }
    case Actions.CLEAR_ALL: {
      storage.clear();
      return {
        ...state,
        notes: [],
        notebooks: [],
        trash: [],
        pinned: {
          notes: [],
          notebooks: [],
        },
        tags: [],
        favorites: [],
        colorNotes: [],
        user: null,
      };
    }
    case Actions.NOTES:
      return {
        ...state,
        notes: db.notes.group(SORT[sortSettings.sort]),
      };
    case Actions.THEME: {
      return {
        ...state,
        colors: action.colors,
      };
    }
    case Actions.USER: {
      let user = action.user;
      return {
        ...state,
        user: user,
      };
    }
    case Actions.NOTEBOOKS: {
      return {
        ...state,
        notebooks: db.notebooks.all,
      };
    }
    case Actions.SETTINGS: {
      return {
        ...state,
        settings: action.settings,
      };
    }
    case Actions.TRASH: {
      return {
        ...state,
        trash: db.trash.all,
      };
    }
    case Actions.PINNED: {
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
    case Actions.CURRENT_SCREEN: {
      return {
        ...state,
        currentScreen: action.screen,
      };
    }
    case Actions.TAGS: {
      return {
        ...state,
        tags: db.tags.all,
      };
    }
    case Actions.FAVORITES: {
      return {
        ...state,
        favorites: db.notes.favorites,
      };
    }
    case Actions.COLORS: {
      return {
        ...state,
        colorNotes: db.colors.all,
      };
    }
    case Actions.SELECTION_MODE: {
      if (action.enabled) {
        eSendEvent(eCloseSideMenu);
      } else {
        eSendEvent(eOpenSideMenu);
      }

      return {
        ...state,
        selectionMode: action.enabled,
      };
    }
    case Actions.SELECT_ALL: {
      return {
        ...state,
        selectedItemsList: action.selected,
      };
    }
    case Actions.SELECTED_ITEMS: {
      let selectedItems = [...state.selectedItemsList];
      if (selectedItems.includes(action.item)) {
        selectedItems.splice(selectedItems.indexOf(action.item), 1);
      } else {
        selectedItems.push(action.item);
      }
      history.selectedItemsList = selectedItems;
      if (selectedItems.length === 0) {
        eSendEvent(eOpenSideMenu);
      }
      return {
        ...state,
        selectedItemsList: selectedItems,
        selectionMode: selectedItems.length > 0 ? state.selectionMode : false,
      };
    }
    case Actions.CLEAR_SELECTION: {
      history.selectedItemsList = [];
      eSendEvent(eOpenSideMenu);
      return {
        ...state,
        selectedItemsList: [],
      };
    }
    case Actions.MODAL_NAVIGATOR: {
      return {
        ...state,
        preventDefaultMargins: action.enabled,
      };
    }
    case Actions.LOGIN_NAVIGATOR: {
      return {
        ...state,
        isLoginNavigator: action.enabled,
      };
    }
    case Actions.CURRENT_EDITING_NOTE: {
      return {
        ...state,
        currentEditingNote: action.id,
      };
    }
    case Actions.SEARCH_RESULTS: {
      return {
        ...state,
        searchResults: action.results,
      };
    }
    case Actions.HEADER_STATE: {
      return {
        ...state,
        headerMenuState: action.state,
      };
    }
    case Actions.SEARCH_STATE: {
      let stat = {
        ...state.searchState,
        ...action.state,
      };

      return {
        ...state,
        searchState: stat,
      };
    }
    case Actions.CONTAINER_STATE: {
      return {
        ...state,
        containerState: action.state,
      };
    }
    case Actions.HEADER_TEXT_STATE: {
      let stat = {
        ...state.headerTextState,
        ...action.state,
      };
      return {
        ...state,
        headerTextState: stat,
      };
    }
    case Actions.HEADER_VERTICAL_MENU: {
      return {
        ...state,
        headerVerticalMenu: action.state,
      };
    }
    case Actions.CONTAINER_BOTTOM_BUTTON: {
      let _state = {
        ...defaultState.containerBottomButton,
        ...action.state,
      };
      return {
        ...state,
        containerBottomButton: _state,
      };
    }
    case Actions.MESSAGE_BOARD_STATE: {
      return {
        ...state,
        messageBoardState: action.state,
      };
    }
    case Actions.FULLSCREEN: {
      return {
        ...state,
        fullscreen: action.state,
      };
    }
    case Actions.DEVICE_MODE: {
      return {
        ...state,
        deviceMode: action.state,
      };
    }
    default:
      throw new Error('unknown action type');
  }
};
