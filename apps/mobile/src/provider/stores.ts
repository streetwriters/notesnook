import create, {State} from 'zustand';
import {eSendEvent} from '../services/EventManager';
import {history, SORT, sortSettings} from '../utils';
import {db} from '../utils/DB';
import {eOpenSideMenu} from '../utils/Events';
import {
  MenuStore,
  MessageStore,
  Item,
  NoteStore,
  NotebookStore,
  TagStore,
  TrashStore,
  SearchStore,
  SelectionStore,
  SettingStore,
  EditorStore,
  FavoriteStore,
  UserStore,
} from './interfaces';

export const useNoteStore = create<NoteStore>((set, get) => ({
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

export const useNotebookStore = create<NotebookStore>((set, get) => ({
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

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
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

export const useTagStore = create<TagStore>((set, get) => ({
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

export const useTrashStore = create<TrashStore>((set, get) => ({
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

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  premium: false,
  lastSynced: 'Never',
  syncing: false,
  setUser: user => set({user: user}),
  setPremium: premium => set({premium: premium}),
  setSyncing: syncing => set({syncing: syncing}),
  setLastSynced: lastSynced => set({lastSynced: lastSynced}),
}));

export const useSettingStore = create<SettingStore>((set, get) => ({
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
  setSettings: settings => set({settings}),
  setFullscreen: fullscreen => set({fullscreen}),
  setDeviceMode: mode => set({deviceMode: mode}),
}));

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => set({menuPins: db.settings.pins}),
  setColorNotes: () => set({colorNotes: db.colors.all}),
}));

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentEditingNote: null,
  setCurrentlyEditingNote: note => set({currentEditingNote: note}),
}));

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchResults: [],
  searching: false,
  searchStatus: null,
  setSearchResults: results => set({searchResults: results}),
  setSearchStatus: (searching, status) =>
    set({searching, searchStatus: status}),
}));

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedItemsList: [],
  selectionMode: false,
  setAll: all => {
    history.selectedItemsList = all;
    set({selectedItemsList: all});
  },
  setSelectionMode: mode => set({selectionMode: mode}),
  setSelectedItem: item => {
    let selectedItems = get().selectedItemsList;
    let index = selectedItems.findIndex((i: Item) => i.id === item.id);
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
      selectedItems.length > 0 ? get().selectionMode : false;

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

export const useMessageStore = create<MessageStore>((set, get) => ({
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
