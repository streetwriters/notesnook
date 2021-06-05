import {useReducer} from 'react';
import {createContainer} from 'react-tracked';
import {reducer} from './Reducer';
import {defaultState} from './DefaultState';
import {db} from '../utils/DB';
import {history, SORT, sortSettings} from '../utils';
import create from 'zustand';
import {eOpenSideMenu} from '../utils/Events';
import {eSendEvent} from '../services/EventManager';

const useValue = () => useReducer(reducer, defaultState);

export const {Provider, useTracked, useTrackedState} = createContainer(
  useValue,
);

/**
 * create(set => ({
  bears: 0,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 })
}))
 */

export const useNoteStore = create((set, get) => ({
  notes: [],
  loading: true,
  setLoading: loading => set({loading: loading}),
  setNotes: items => {
    if (!items) {
      set({
        notes: db.notes.group(SORT[sortSettings.sort], sortSettings.sortOrder),
      });
      return;
    }
    let prev = get().notes;
    for (var i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({notes: prev});
  },
  clearNotes: () => set({notes: []}),
}));

export const useNotebookStore = create((set, get) => ({
  notebooks: [],
  setNotebooks: items => {
    if (!items) {
      set({
        notebooks: db.notebooks.all,
      });
      return;
    }
    let prev = get().notebooks;
    for (var i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({notebooks: prev});
  },
  clearNotebooks: () => set({notebooks: []}),
}));

export const useFavoriteStore = create((set, get) => ({
  favorites: [],
  setFavorites: items => {
    if (!items) {
      set({
        favorites: db.notes.favorites,
      });
      return;
    }
    let prev = get().favorites;
    for (var i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({favorites: prev});
  },
  clearFavorites: () => set({favorites: []}),
}));

export const useTagStore = create((set, get) => ({
  tags: [],
  setTags: items => {
    if (!items) {
      set({
        tags: db.tags.all,
      });
      return;
    }
    let prev = get().tags;
    for (var i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({tags: prev});
  },
  clearTags: () => set({tags: []}),
}));

export const useTrashStore = create((set, get) => ({
  trash: [],
  setTrash: items => {
    if (!items) {
      set({
        trash: db.trash.all,
      });
      return;
    }
    let prev = get().trash;
    for (var i = 0; i < items.length; i++) {
      let item = items[i];
      let index = prev.findIndex(v => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({trash: prev});
  },
  clearTrash: () => set({trash: []}),
}));

export const useUserStore = create((set, get) => ({
  user: null,
  premium: false,
  lastSynced: 'Never',
  syncing: false,
  setUser: user => set({user: user}),
  setPremium: premium => set({premium: premium}),
  setSyncing: syncing => set({syncing: syncing}),
  setLastSynced: lastSynced => set({lastSynced: lastSynced}),
}));

export const useSettingStore = create((set, get) => ({
  settings: {
    showToolbarOnTop: false,
    showKeyboardOnOpen: false,
    fontScale: 1,
    forcePortraitOnTablet: false,
    useSystemTheme: false,
    reminder: 'off',
    encryptedBackup: false,
    homepage: 'Notes',
    sort: 'default',
    sortOrder: 'desc',
    screenshotMode: true,
    privacyScreen: false,
    appLockMode: 'none',
  },
  fullscreen: false,
  deviceMode: null,
}));

export const useMenuStore = create((set, get) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => set({menuPins: db.settings.pins}),
  setColorNotes: () => set({colorNotes: db.colors.all}),
}));

export const useEditorStore = create((set, get) => ({
  currentEditingNote: null,
  setCurrentlyEditingNote: note => set({currentEditingNote: note}),
}));

export const useSearchStore = create((set, get) => ({
  searchResults: [],
  searching: false,
  searchStatus: null,
  setSearchResults: results => set({searchResults: results}),
  setSearchStatus: ({searching, status}) =>
    set({searching, searchStatus: status}),
}));

export const useSelectionStore = create((set, get) => ({
  selectedItemsList: [],
  selectionMode: false,
  setAll: all => {
    history.selectedItemsList = all;
    set({selectedItemsList: all});
  },
  setSelectionMode: mode => set({selectionMode: mode}),
  setSelectedItem: item => {
    let selectedItems = get().selectedItemsList;
    let index = selectedItems.findIndex(i => i.id === item.id);
    if (index !== -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item);
    }
    selectedItems = [...new Set(selectedItems)];
    history.selectedItemsList = selectedItems;
    if (selectedItems.length === 0) {
      eSendEvent(eOpenSideMenu);
    }
    history.selectionMode =
      selectedItems.length > 0 ? state.selectionMode : false;

    set({
      selectedItemsList: selectedItems,
      selectionMode: history.selectionMode,
    });
  },
  clearSelection: () => {
    eSendEvent(eOpenSideMenu);
    set({selectionMode: false, selectedItemsList: []});
  },
}));

export const useMessageStore = create((set, get) => ({
  message: {
    visible: false,
    message: null,
    actionText: null,
    onPress: () => {},
    data: {},
    icon: 'account-outline',
  },
  setMessage: message => set({message}),
}));
