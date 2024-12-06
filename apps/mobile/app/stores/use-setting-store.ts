/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Dimensions, PlatformOSType } from "react-native";
import Config from "react-native-config";
import { Sound } from "react-native-notification-sounds";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { FileType } from "react-native-scoped-storage";
import create, { State } from "zustand";
import { ThemeDark, ThemeLight, ThemeDefinition } from "@notesnook/theme";
import { Reminder } from "@notesnook/core";
export const HostIds = [
  "API_HOST",
  "AUTH_HOST",
  "SSE_HOST",
  "MONOGRAPH_HOST"
] as const;
export type HostId = (typeof HostIds)[number];

export type Settings = {
  showToolbarOnTop?: boolean;
  showKeyboardOnOpen?: boolean;
  fontScale?: number;
  forcePortraitOnTablet?: boolean;
  useSystemTheme?: boolean;
  reminder: "daily" | "off" | "useroff" | "weekly" | "monthly";
  fullBackupReminder: "never" | "weekly" | "monthly";
  encryptedBackup?: boolean;
  homepage?: string;
  sort?: string;
  sortOrder?: string;
  screenshotMode?: boolean;
  privacyScreen?: boolean;
  appLockTimer: number;
  appLockEnabled?: boolean;
  appLockMode?: "none" | "background" | "launch";
  notebooksListMode?: "normal" | "compact";
  notesListMode?: "normal" | "compact";
  devMode?: boolean;
  notifNotes?: boolean;
  pitchBlack?: boolean;
  reduceAnimations?: boolean;
  rateApp?: boolean | number;
  migrated?: boolean;
  introCompleted?: boolean;
  nextBackupRequestTime?: number;
  lastBackupDate?: number;
  userEmailConfirmed?: boolean;
  recoveryKeySaved?: boolean;
  backupDirectoryAndroid?: FileType | null;
  showBackupCompleteSheet: boolean;
  lastRecoveryEmailTime?: number;
  lastVerificationEmailTime?: number;
  sessionExpired: boolean;
  version: string | null;
  doubleSpacedLines?: boolean;
  disableAutoSync?: boolean;
  disableSync?: boolean;
  reminderNotifications?: boolean;
  defaultSnoozeTime?: string;
  reminderNotificationMode: Reminder["priority"];
  corsProxy: string;
  disableRealtimeSync?: boolean;
  notificationSound?: Sound & { platform: PlatformOSType };
  defaultFontSize: number;
  defaultFontFamily: string;
  colorScheme: "dark" | "light";
  lighTheme: ThemeDefinition;
  darkTheme: ThemeDefinition;
  markdownShortcuts?: boolean;
  appLockHasPasswordSecurity?: boolean;
  biometricsAuthEnabled?: boolean;
  backgroundSync?: boolean;
  applockKeyboardType: "numeric" | "default";
  settingsVersion?: number;
  backupType: "full" | "partial";
  offlineMode?: boolean;
  lastFullBackupDate?: number;
  serverUrls?: Record<HostId, string>;
};

type DimensionsType = {
  width: number;
  height: number;
};

type Insets = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export interface SettingStore extends State {
  settings: Settings;
  fullscreen: boolean;
  deviceMode: string | null;
  dimensions: DimensionsType;
  setSettings: (settings: Settings) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setDeviceMode: (mode: string | null) => void;
  setDimensions: (dimensions: DimensionsType) => void;
  isAppLoading: boolean;
  setAppLoading: (isAppLoading: boolean) => void;
  setSheetKeyboardHandler: (sheetKeyboardHandler: boolean) => void;
  sheetKeyboardHandler: boolean;
  requestBiometrics: boolean;
  setRequestBiometrics: (requestBiometrics: boolean) => void;
  appDidEnterBackgroundForAction: boolean;
  setAppDidEnterBackgroundForAction: (value: boolean) => void;
  insets: Insets;
  setInsets: (insets: Insets) => void;
  timeFormat: string;
  dateFormat: string;
  dbPassword?: string;
  isOldAppLock: () => boolean;
}

const { width, height } = Dimensions.get("window");

export const defaultSettings: SettingStore["settings"] = {
  applockKeyboardType: "numeric",
  appLockTimer: 0,
  showToolbarOnTop: false,
  disableAutoSync: false,
  disableRealtimeSync: false,
  disableSync: false,
  appLockEnabled: false,
  backupDirectoryAndroid: null,
  offlineMode: false,
  showKeyboardOnOpen: false,
  fontScale: 1,
  forcePortraitOnTablet: false,
  useSystemTheme: true,
  reminder: "off",
  encryptedBackup: false,
  homepage: "Notes",
  sort: "default",
  sortOrder: "desc",
  screenshotMode: true,
  privacyScreen: false,
  appLockMode: "none",
  notebooksListMode: "normal",
  notesListMode: "normal",
  devMode: false,
  notifNotes: false,
  pitchBlack: false,
  reduceAnimations: false,
  rateApp: false,
  migrated: false,
  introCompleted: Config.isTesting ? true : false,
  nextBackupRequestTime: undefined,
  lastBackupDate: 0,
  userEmailConfirmed: false,
  recoveryKeySaved: false,
  showBackupCompleteSheet: true,
  sessionExpired: false,
  version: null,
  doubleSpacedLines: true,
  reminderNotifications: true,
  defaultSnoozeTime: "5",
  corsProxy: "https://cors.notesnook.com",
  reminderNotificationMode: "urgent",
  notificationSound: undefined,
  defaultFontFamily: "sans-serif",
  defaultFontSize: 16,
  colorScheme: "light",
  lighTheme: ThemeLight,
  darkTheme: ThemeDark,
  markdownShortcuts: true,
  biometricsAuthEnabled: false,
  appLockHasPasswordSecurity: false,
  backgroundSync: true,
  settingsVersion: 0,
  backupType: "partial",
  fullBackupReminder: "never",
  lastFullBackupDate: 0
};

export const useSettingStore = create<SettingStore>((set, get) => ({
  dbPassword: undefined,
  settings: { ...defaultSettings },
  sheetKeyboardHandler: true,
  fullscreen: false,
  deviceMode: null,
  dimensions: { width, height },
  isAppLoading: true,
  setSettings: (settings) => set({ settings }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  setDeviceMode: (mode) => set({ deviceMode: mode }),
  setDimensions: (dimensions) => set({ dimensions: dimensions }),
  setAppLoading: (isAppLoading) => set({ isAppLoading }),
  setSheetKeyboardHandler: (sheetKeyboardHandler) =>
    set({ sheetKeyboardHandler }),
  requestBiometrics: false,
  setRequestBiometrics: (requestBiometrics) => set({ requestBiometrics }),
  setInsets: (insets) => set({ insets }),
  timeFormat: "12-hour",
  dateFormat: "DD-MM-YYYY",
  setAppDidEnterBackgroundForAction: (value: boolean) => {
    set({
      appDidEnterBackgroundForAction: value
    });
  },
  appDidEnterBackgroundForAction: false,
  isOldAppLock: () => {
    return (
      get().settings.appLockHasPasswordSecurity === undefined &&
      get().settings.biometricsAuthEnabled === undefined &&
      get().settings.appLockMode !== "none"
    );
  },
  insets: initialWindowMetrics?.insets
    ? initialWindowMetrics.insets
    : { top: 0, right: 0, left: 0, bottom: 0 }
}));
