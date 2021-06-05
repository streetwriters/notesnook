import create, { State } from 'zustand';
import { eSendEvent } from '../services/EventManager';
import { history, SORT, sortSettings } from '../utils';
import { db } from '../utils/DB';
import { eOpenSideMenu } from '../utils/Events';

type Item = {
    id: string
}

interface NoteStore extends State {
    notes: Item[],
    loading: boolean,
    setLoading: (loading: boolean) => void,
    setNotes: (items: Item[]) => void,
    clearNotes: () => void
}

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

interface NotebookStore extends State {
    notebooks: Item[],
    setNotebooks: (items: Item[]) => void,
    clearNotebooks: () => void
}

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


interface FavoriteStore extends State {
    favorites: Item[],
    setFavorites: (items: Item[]) => void,
    clearFavorites: () => void
}

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

interface TagStore extends State {
    tags: Item[],
    setTags: (items: Item[]) => void,
    clearTags: () => void
}


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

interface TrashStore extends State {
    trash: Item[],
    setTrash: (items: Item[]) => void,
    clearTrash: () => void
}

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

interface UserStore extends State {
    user: object,
    premium: boolean,
    lastSynced: string,
    syncing: boolean,
    setUser: (user: object) => void,
    setPremium: (premium: boolean) => void,
    setSyncing: (syncing: boolean) => void,
    setLastSynced: (lastSynced: string) => void,
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    premium: false,
    lastSynced: 'Never',
    syncing: false,
    setUser: user => set({ user: user }),
    setPremium: premium => set({ premium: premium }),
    setSyncing: syncing => set({ syncing: syncing }),
    setLastSynced: lastSynced => set({ lastSynced: lastSynced }),
}));

type Settings = {
    showToolbarOnTop?: boolean,
    showKeyboardOnOpen?: boolean,
    fontScale?: number,
    forcePortraitOnTablet?: boolean,
    useSystemTheme?: boolean,
    reminder?: string,
    encryptedBackup?: boolean,
    homepage?: string,
    sort?: string,
    sortOrder?: string,
    screenshotMode?: boolean,
    privacyScreen?: boolean,
    appLockMode?: string,
}

interface SettingStore extends State {
    settings: Settings,
    fullscreen: boolean,
    deviceMode: string | null,
    setSettings: (settings: Settings) => void,
    setFullscreen: (fullscreen: boolean) => void,
    setDeviceMode: (mode: string) => void
}

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
    setSettings: (settings) => set({ settings }),
    setFullscreen: (fullscreen) => set({ fullscreen }),
    setDeviceMode: (mode) => set({ deviceMode: mode })
}));


interface MenuStore extends State {
    menuPins: object[],
    colorNotes: object[],
    setMenuPins: () => void,
    setColorNotes: () => void
}

export const useMenuStore = create<MenuStore>((set, get) => ({
    menuPins: [],
    colorNotes: [],
    setMenuPins: () => set({ menuPins: db.settings.pins }),
    setColorNotes: () => set({ colorNotes: db.colors.all }),
}));

interface EditorStore extends State {
    currentEditingNote: string | null,
    setCurrentlyEditingNote: (note: string) => void,
}
export const useEditorStore = create<EditorStore>((set, get) => ({
    currentEditingNote: null,
    setCurrentlyEditingNote: note => set({ currentEditingNote: note }),
}));

interface SearchStore extends State {
    searchResults: object[],
    searching: boolean,
    searchStatus: string | null,
    setSearchResults: (results: object[]) => void,
    setSearchStatus: (searching: boolean, status: string | null) => void
}

export const useSearchStore = create<SearchStore>((set, get) => ({
    searchResults: [],
    searching: false,
    searchStatus: null,
    setSearchResults: results => set({ searchResults: results }),
    setSearchStatus: (searching, status) =>
        set({ searching, searchStatus: status }),
}));

interface SelectionStore extends State {
    selectedItemsList: object[],
    selectionMode: boolean,
    setAll: (all: object[]) => void,
    setSelectionMode: (mode: boolean) => void,
    setSelectedItem: (item: Item) => void,
    clearSelection: () => void,
}

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
        set({ selectionMode: false, selectedItemsList: [] });
    },
}));

type Message = {
    visible: boolean,
    message: string | null,
    actionText: string | null,
    onPress: () => void,
    data: object,
    icon: string,
}

interface MessageStore extends State {
    message: Message
    setMessage: (message: Message) => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
    message: {
        visible: false,
        message: null,
        actionText: null,
        onPress: () => { },
        data: {},
        icon: 'account-outline',
    },
    setMessage: message => set({ message }),
}));
