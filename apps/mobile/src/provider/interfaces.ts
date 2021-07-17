import { State } from 'zustand';

export type Item = {
    id: string
}


export interface NoteStore extends State {
    notes: Item[],
    loading: boolean,
    setLoading: (loading: boolean) => void,
    setNotes: (items?: Item[]) => void,
    clearNotes: () => void
}

export interface NotebookStore extends State {
    notebooks: Item[],
    setNotebooks: (items?: Item[]) => void,
    clearNotebooks: () => void
}



export interface FavoriteStore extends State {
    favorites: Item[],
    setFavorites: (items?: Item[]) => void,
    clearFavorites: () => void
}



export interface TagStore extends State {
    tags: Item[],
    setTags: (items?: Item[]) => void,
    clearTags: () => void
}


export interface TrashStore extends State {
    trash: Item[],
    setTrash: (items?: Item[]) => void,
    clearTrash: () => void
}



export interface UserStore extends State {
    user: object,
    premium: boolean,
    lastSynced: string,
    syncing: boolean,
    setUser: (user: object) => void,
    setPremium: (premium: boolean) => void,
    setSyncing: (syncing: boolean) => void,
    setLastSynced: (lastSynced: string) => void,
    verifyUser: boolean,
    setVerifyUser: (verified: boolean) => void
}



export type Settings = {
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
    telemetry:boolean,
    notebooksListMode: "normal" | "compact",
    notesListMode: "normal" | "compact",

}

type Dimensions = {
    width: number,
    height: number
}

export interface SettingStore extends State {
    settings: Settings,
    fullscreen: boolean,
    deviceMode: string | null,
    dimensions: Dimensions
    setSettings: (settings: Settings) => void,
    setFullscreen: (fullscreen: boolean) => void,
    setDeviceMode: (mode: string) => void,
    setDimensions: (dimensions: Dimensions) => void
    appLoading:boolean
    setAppLoading:(appLoading:boolean) => void
    isIntroCompleted:boolean
    setIntroCompleted:(isIntroCompleted:boolean) => void
}

export interface MenuStore extends State {
    menuPins: object[],
    colorNotes: object[],
    setMenuPins: () => void,
    setColorNotes: () => void
    clearAll: () => void
}


export interface EditorStore extends State {
    currentEditingNote: string | null,
    setCurrentlyEditingNote: (note: string) => void,
}


export interface SearchStore extends State {
    searchResults: object[],
    searching: boolean,
    searchStatus: string | null,
    setSearchResults: (results: object[]) => void,
    setSearchStatus: (searching: boolean, status: string | null) => void
}


export interface SelectionStore extends State {
    selectedItemsList: object[],
    selectionMode: boolean,
    setAll: (all: object[]) => void,
    setSelectionMode: (mode: boolean) => void,
    setSelectedItem: (item: Item) => void,
    clearSelection: () => void,
}

export type Message = {
    visible: boolean
    message: string | null
    actionText: string | null
    onPress: () => void
    data: object
    icon: string
}

export type Action = {
    type: string
    platforms: string[]
    title: string
    data: string
}

export type Announcement = {
    title: string
    description: string
    id: string
    callToActions: Action[]
    timestamp: number
    platforms: string[]
    isActive: boolean
    userTypes: string[]
}

export interface MessageStore extends State {
    message: Message
    setMessage: (message: Message) => void
    announcements: Announcement[],
    setAnnouncement: () => Promise<void>
    remove: (id: string) => void
}


