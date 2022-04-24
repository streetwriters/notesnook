//@ts-ignore
import { Dimensions } from 'react-native';
import { FileType } from 'react-native-scoped-storage';
import create, { State } from 'zustand';
import { ACCENT } from '../utils/color-scheme';

export type Settings = {
  showToolbarOnTop?: boolean;
  showKeyboardOnOpen?: boolean;
  fontScale?: number;
  forcePortraitOnTablet?: boolean;
  useSystemTheme?: boolean;
  reminder?: string;
  encryptedBackup?: boolean;
  homepage?: string;
  sort?: string;
  sortOrder?: string;
  screenshotMode?: boolean;
  privacyScreen?: boolean;
  appLockMode?: string;
  telemetry?: boolean;
  notebooksListMode?: 'normal' | 'compact';
  notesListMode?: 'normal' | 'compact';
  devMode?: boolean;
  notifNotes?: boolean;
  pitchBlack?: boolean;
  reduceAnimations?: boolean;
  rateApp?: boolean | number;
  migrated?: boolean;
  introCompleted?: boolean;
  nextBackupRequestTime?: number | undefined;
  lastBackupDate?: number | undefined;
  userEmailConfirmed?: boolean;
  recoveryKeySaved?: boolean;
  theme: {
    accent: string;
    dark: boolean;
  };
  backupDirectoryAndroid?: FileType | null;
  showBackupCompleteSheet: boolean;
  lastRecoveryEmailTime?: number;
  lastVerificationEmailTime?: number;
  sessionExpired: boolean;
  version: number | null;
};

type Dimensions = {
  width: number;
  height: number;
};

export interface SettingStore extends State {
  settings: Settings;
  fullscreen: boolean;
  deviceMode: string | null;
  dimensions: Dimensions;
  setSettings: (settings: Settings) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setDeviceMode: (mode: string) => void;
  setDimensions: (dimensions: Dimensions) => void;
  appLoading: boolean;
  setAppLoading: (appLoading: boolean) => void;
  setSheetKeyboardHandler: (sheetKeyboardHandler: boolean) => void;
  sheetKeyboardHandler: boolean;
  requestBiometrics: boolean;
  setRequestBiometrics: (requestBiometrics: boolean) => void;
}

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
    telemetry: true,
    notebooksListMode: 'normal',
    notesListMode: 'normal',
    devMode: false,
    notifNotes: false,
    pitchBlack: false,
    reduceAnimations: false,
    rateApp: false,
    migrated: false,
    introCompleted: false,
    nextBackupRequestTime: undefined,
    lastBackupDate: undefined,
    userEmailConfirmed: false,
    recoveryKeySaved: false,
    theme: {
      accent: ACCENT.color,
      dark: false
    },
    showBackupCompleteSheet: true,
    sessionExpired: false,
    version: null
  },
  sheetKeyboardHandler: true,
  fullscreen: false,
  deviceMode: 'mobile',
  dimensions: { width, height },
  appLoading: true,
  setSettings: settings => set({ settings }),
  setFullscreen: fullscreen => set({ fullscreen }),
  setDeviceMode: mode => set({ deviceMode: mode }),
  setDimensions: dimensions => set({ dimensions: dimensions }),
  setAppLoading: appLoading => set({ appLoading }),
  setSheetKeyboardHandler: sheetKeyboardHandler => set({ sheetKeyboardHandler }),
  requestBiometrics: false,
  setRequestBiometrics: requestBiometrics => set({ requestBiometrics })
}));
