import {Platform} from 'react-native';
import {Dimensions} from 'react-native';
import create from 'zustand';
import PremiumService from '../services/PremiumService';
import {history, SUBSCRIPTION_STATUS} from '../utils';
import { APP_VERSION } from "../../version";
import {db} from '../utils/database';
import {MMKV} from '../utils/mmkv';
import {
  MenuStore,
  MessageStore,
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
  Announcement
} from './interfaces';
//@ts-ignore
import {groupArray} from 'notes-core/utils/grouping';
import {EditorWebView, post} from '../views/Editor/Functions';
import tiny from '../views/Editor/tiny/tiny';
import {eSubscribeEvent, eUnSubscribeEvent} from '../services/EventManager';
import {endSearch} from '../views/Editor/tiny/toolbar/commands';

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  loading: true,
  setLoading: loading => set({loading: loading}),
  setNotes: items => {
    if (!items) {
      set({
        notes: groupArray(db.notes.all, db.settings?.getGroupOptions('home'))
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
  clearNotes: () => set({notes: []})
}));

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  notebooks: [],
  setNotebooks: items => {
    if (!items) {
      set({
        notebooks: groupArray(
          db.notebooks.all,
          db.settings?.getGroupOptions('notebooks')
        )
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
  clearNotebooks: () => set({notebooks: []})
}));

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],
  setFavorites: items => {
    if (!items) {
      set({
        favorites: groupArray(
          db.notes.favorites,
          db.settings?.getGroupOptions('favorites')
        )
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
  clearFavorites: () => set({favorites: []})
}));

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  setTags: items => {
    if (!items) {
      set({
        tags: groupArray(db.tags.all, db.settings?.getGroupOptions('tags'))
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
  clearTags: () => set({tags: []})
}));

export const useTrashStore = create<TrashStore>((set, get) => ({
  trash: [],
  setTrash: items => {
    if (!items) {
      set({
        trash: groupArray(db.trash.all, db.settings?.getGroupOptions('trash'))
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
  clearTrash: () => set({trash: []})
}));

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  premium: false,
  lastSynced: 'Never',
  syncing: false,
  verifyUser: false,
  setUser: user => set({user: user}),
  setPremium: premium => set({premium: premium}),
  setSyncing: syncing => set({syncing: syncing}),
  setLastSynced: lastSynced => set({lastSynced: lastSynced}),
  setVerifyUser: verified => set({verifyUser: verified})
}));

interface AttachmentStore {
  progress?: {
    [name: string]: {
      sent: number;
      total: number;
      hash: string;
      recieved: number;
      type: 'upload' | 'download';
    } | null;
  };
  encryptionProgress: number;
  setEncryptionProgress: (encryptionProgress: number) => void;
  remove: (hash: string) => void;
  setProgress: (
    sent: number,
    total: number,
    hash: string,
    recieved: number,
    type: 'upload' | 'download'
  ) => void;
  loading: {total: number; current: number};
  setLoading: (data: {total: number; current: number}) => void;
}

export const useAttachmentStore = create<AttachmentStore>((set, get) => ({
  progress: {},
  remove: hash => {
    let _p = get().progress;
    if (!_p) return;
    _p[hash] = null;
    tiny.call(
      EditorWebView,
      `
    (function() {
      let progress = ${JSON.stringify({
        loaded: 1,
        total: 1,
        hash
      })}
    tinymce.activeEditor._updateAttachmentProgress(progress);
    })()`
    );
    set({progress: {..._p}});
  },
  setProgress: (sent, total, hash, recieved, type) => {
    let _p = get().progress;
    if (!_p) return;
    _p[hash] = {sent, total, hash, recieved, type};
    let progress = {total, hash, loaded: type === 'download' ? recieved : sent};
    tiny.call(
      EditorWebView,
      `
    (function() {
      let progress = ${JSON.stringify(progress)}
      tinymce.activeEditor._updateAttachmentProgress(progress);
    })()`
    );
    set({progress: {..._p}});
  },
  encryptionProgress: 0,
  setEncryptionProgress: encryptionProgress =>
    set({encryptionProgress: encryptionProgress}),
  loading: {total: 0, current: 0},
  setLoading: data => set({loading: data})
}));

let {width, height} = Dimensions.get('window');

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
    telemetry: true,
    notebooksListMode: 'normal',
    notesListMode: 'normal',
    devMode: false,
    notifNotes: false,
    pitchBlack: false
  },
  fullscreen: false,
  deviceMode: 'mobile',
  dimensions: {width, height},
  appLoading: true,
  isIntroCompleted: false,
  setSettings: settings => set({settings}),
  setFullscreen: fullscreen => set({fullscreen}),
  setDeviceMode: mode => set({deviceMode: mode}),
  setDimensions: dimensions => set({dimensions: dimensions}),
  setAppLoading: appLoading => set({appLoading}),
  setIntroCompleted: isIntroCompleted => set({isIntroCompleted})
}));

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuPins: [],
  colorNotes: [],
  setMenuPins: () => {
    try {
      set({menuPins: db.settings.pins});
    } catch (e) {
      setTimeout(() => {
        try {
          set({menuPins: db.settings.pins});
        } catch (e) {}
      }, 1000);
    }
  },
  setColorNotes: () => set({colorNotes: db.colors.all}),
  clearAll: () => set({menuPins: [], colorNotes: []})
}));

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentEditingNote: null,
  setCurrentlyEditingNote: note => set({currentEditingNote: note}),
  sessionId: null,
  setSessionId: sessionId => {
    console.log(sessionId, 'session id');
    set({sessionId});
  },
  searchReplace: false,
  searchSelection: null,
  setSearchReplace: searchReplace => {
    if (!searchReplace) {
      set({searchSelection: null, searchReplace: false});
      return;
    }
    let func = (value: string) => {
      console.log("setSearchReplace:", value, value.length);
      if ((!value || value.trim() === '') && get().searchReplace) {
        endSearch();
        return;
      }

      set({searchSelection: value, searchReplace: true});

      eUnSubscribeEvent('selectionvalue', func);
    };
    eSubscribeEvent('selectionvalue', func);
    tiny.call(
      EditorWebView,
      `(function() {
      if (editor) {
        reactNativeEventHandler('selectionvalue',editor.selection.getContent());
      }
    })();`
    );
  }
}));

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchResults: [],
  searching: false,
  searchStatus: null,
  setSearchResults: results => set({searchResults: results}),
  setSearchStatus: (searching, status) => set({searching, searchStatus: status})
}));

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedItemsList: [],
  selectionMode: false,
  setAll: all => {
    //@ts-ignore
    history.selectedItemsList = all;
    set({selectedItemsList: all});
  },
  setSelectionMode: mode => {
    if (!mode) {
      history.selectedItemsList = [];
      history.selectionMode = false;
    }
    set({
      selectionMode: mode,
      selectedItemsList: mode ? get().selectedItemsList : []
    });
  },
  setSelectedItem: item => {
    let selectedItems = get().selectedItemsList;
    let index = selectedItems.findIndex((i: any) => i.id === item.id);
    if (index !== -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item);
    }
    selectedItems = [...new Set(selectedItems)];
    //@ts-ignore
    history.selectedItemsList = selectedItems;

    history.selectionMode =
      selectedItems.length > 0 ? get().selectionMode : false;

    set({
      selectedItemsList: selectedItems,
      selectionMode: history.selectionMode
    });
  },
  clearSelection: () => {
    history.selectedItemsList = [];
    history.selectionMode = false;
    set({selectionMode: false, selectedItemsList: []});
  }
}));

export const useMessageStore = create<MessageStore>((set, get) => ({
  message: {
    visible: false,
    message: null,
    actionText: null,
    onPress: () => {},
    data: {},
    icon: 'account-outline'
  },
  setMessage: message => set({message: {...message}}),
  announcements: [],
  remove: async id => {
    MMKV.setStringAsync(id, 'removed');

    const inlineCopy = get().announcements.slice();
    const dialogsCopy = get().dialogs.slice();
    const index = inlineCopy.findIndex(announcement => announcement.id === id);
    const dialogIndex = dialogsCopy.findIndex(dialog => dialog.id === id);

    if (index >= -1) {
      dialogsCopy.splice(dialogIndex, 1);
      inlineCopy.splice(index, 1);
    }

    set({announcements: inlineCopy, dialogs: dialogsCopy});
  },
  dialogs: [],
  setAnnouncement: async function () {
    let announcements: Announcement[] = [];
    try {
      announcements = await db.announcements();
      if (!announcements) {
        announcements = [];
      }
    } catch (e) {
      console.log('ERROR', e);
      set({announcements: []});
    } finally {
      let all = await getFiltered(announcements);
      set({
        announcements: all.filter(a => a.type === 'inline'),
        dialogs: all.filter(a => a.type === 'dialog')
      });
    }
  }
}));

const getFiltered = async (announcements: Announcement[]) => {
  if (!announcements) return [];
  let filtered: Announcement[] = [];
  for (var announcement of announcements) {
    if (await shouldShowAnnouncement(announcement)) {
      filtered.push(announcement);
    }
  }
  return filtered;
};

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
  useMenuStore.getState().clearAll();
  useNoteStore.getState().clearNotes();
  useMenuStore.getState().clearAll();
  useTrashStore.getState().clearTrash();
}

export const allowedPlatforms = ['all', 'mobile', Platform.OS];

async function shouldShowAnnouncement(announcement: Announcement) {
  if (!announcement) return false;
  let removed = (await MMKV.getStringAsync(announcement.id)) === 'removed';
  if (removed) return false;
  let show = announcement.platforms.some(
    platform => allowedPlatforms.indexOf(platform) > -1
  );

  if (announcement.appVersion) {
    return announcement.appVersion === APP_VERSION;
  }

  if (!show) return false;
  const subStatus = PremiumService.getUser()?.subscription?.type;
  show = announcement.userTypes.some(userType => {
    switch (userType) {
      case 'pro':
        return PremiumService.get();
      case 'trial':
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case 'trialExpired':
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case 'loggedOut':
        return !PremiumService.getUser();
      case 'verified':
        return PremiumService.getUser()?.isEmailVerified;
      case 'loggedIn':
        return !!PremiumService.getUser();
      case 'unverified':
        return !PremiumService.getUser()?.isEmailVerified;
      case 'proExpired':
        return (
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED
        );
      case 'any':
      default:
        return true;
    }
  });

  return show;
}
