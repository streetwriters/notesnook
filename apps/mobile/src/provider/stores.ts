import { Platform } from 'react-native';
import { Dimensions } from 'react-native';
import create, { State } from 'zustand';
import { eSendEvent } from '../services/EventManager';
import PremiumService from '../services/PremiumService';
import { history, SORT, sortSettings, SUBSCRIPTION_STATUS } from '../utils';
import { db } from '../utils/DB';
import { eOpenSideMenu } from '../utils/Events';
import { MMKV } from '../utils/mmkv';
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
  setLoading: loading => set({ loading: loading }),
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
    set({ notes: prev });
  },
  clearNotes: () => set({ notes: [] }),
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
    set({ notebooks: prev });
  },
  clearNotebooks: () => set({ notebooks: [] }),
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
    set({ favorites: prev });
  },
  clearFavorites: () => set({ favorites: [] }),
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
    set({ tags: prev });
  },
  clearTags: () => set({ tags: [] }),
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
    set({ trash: prev });
  },
  clearTrash: () => set({ trash: [] }),
}));

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  premium: false,
  lastSynced: 'Never',
  syncing: false,
  verifyUser: false,
  setUser: user => set({ user: user }),
  setPremium: premium => set({ premium: premium }),
  setSyncing: syncing => set({ syncing: syncing }),
  setLastSynced: lastSynced => set({ lastSynced: lastSynced }),
  setVerifyUser: (verified) => set({ verifyUser: verified })
}));

let { width, height } = Dimensions.get('window');

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
  dimensions: { width, height },
  setSettings: settings => set({ settings }),
  setFullscreen: fullscreen => set({ fullscreen }),
  setDeviceMode: mode => set({ deviceMode: mode }),
  setDimensions: dimensions => set({ dimensions: dimensions })
}));

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => set({ menuPins: db.settings.pins }),
  setColorNotes: () => set({ colorNotes: db.colors.all }),
}));

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentEditingNote: null,
  setCurrentlyEditingNote: note => set({ currentEditingNote: note }),
}));

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchResults: [],
  searching: false,
  searchStatus: null,
  setSearchResults: results => set({ searchResults: results }),
  setSearchStatus: (searching, status) =>
    set({ searching, searchStatus: status }),
}));

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedItemsList: [],
  selectionMode: false,
  setAll: all => {
    history.selectedItemsList = all;
    set({ selectedItemsList: all });
  },
  setSelectionMode: mode => set({ selectionMode: mode }),
  setSelectedItem: item => {
    let selectedItems = get().selectedItemsList;
    let index = selectedItems.findIndex((i: any) => i.id === item.id);
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
    set({ selectionMode: false, selectedItemsList: [] });
  },
}));

export const useMessageStore = create<MessageStore>((set, get) => ({
  message: {
    visible: false,
    message: null,
    actionText: null,
    onPress: () => { },
    data: {},
    icon: 'account-outline',
  },
  setMessage: message => set({ message: { ...message } }),
  announcements: [],
  remove: async (id) => {
    MMKV.setStringAsync(id, "removed");
    let announcements = get().announcements
    const copy = announcements.slice();
    const index = copy.findIndex((announcement) => announcement.id === id);
    if (index >= -1) {
      copy.splice(index, 1);
    }
    set({ announcements: copy });
  },
  setAnnouncement: async function () {
    let announcements = [];
    try {
      let announcement = await db.announcement()
      let shouldShow = await shouldShowAnnouncement(announcement)
      if (
        shouldShow
      ) {
        announcements = [];
        return;
      }
      set({ announcements: announcement })
    } catch (e) {
      set({ announcements: [] })
    } finally {
      set({ announcements: await getFiltered(announcements) })
    }
  }
}));

const getFiltered = async (announcements) => {
  if (!announcements) return [];
  let filtered = [];
  for (var announcement of announcements) {
    if (await shouldShowAnnouncement(announcement)) {
      filtered.push(announcement);
    }
  }
  return filtered;
}

export function initialize() {
  if (!db) return;
  useMenuStore.getState().setColorNotes();
  useMenuStore.getState().setMenuPins();
  useNotebookStore.getState().setNotebooks();
  useTrashStore.getState().setTrash();
  useTagStore.getState().setTags();
  useFavoriteStore.getState().setFavorites();
  useNoteStore.getState().setNotes();
}

export function clearAllStores() {
  useNotebookStore.getState().clearNotebooks();
  useTagStore.getState().clearTags();
  useFavoriteStore.getState().clearFavorites();
  useNoteStore.getState().clearNotes();
}



export const allowedPlatforms = ['all', 'mobile', Platform.OS];

async function shouldShowAnnouncement(announcement) {
  if (!announcement) return false;
  let removed = await MMKV.getStringAsync(announcement.id) ===
    "removed"
  if (removed) return false;
  let show = announcement.platforms.some(
    (platform) => allowedPlatforms.indexOf(platform) > -1
  );
  if (!show) return false;

  const subStatus = PremiumService.getUser()?.subscription?.type;
  show = announcement.userTypes.some((userType) => {
    switch (userType) {
      case "pro":
        return PremiumService.get()
      case "trial":
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case "trialExpired":
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case 'loggedOut':
        show = !PremiumService.getUser();
        break;
      case 'verified':
        show = PremiumService.getUser()?.isEmailVerified;
        break;
      case 'loggedIn':
        show = !!PremiumService.getUser();
        break;
      case 'unverified':
        show = !PremiumService.getUser()?.isEmailVerified;
        break;
      case 'proExpired':
        show =
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED;
        break;
      case "any":
      default:
        return true;
    }
  });

  return show;
}
