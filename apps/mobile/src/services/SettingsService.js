import { Platform } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import { updateEvent } from '../components/DialogManager/recievers';
import { Actions } from '../provider/Actions';
import { useSettingStore } from '../provider/stores';
import { AndroidModule } from '../utils';
import { getColorScheme } from '../utils/ColorUtils';
import layoutmanager from '../utils/layout-manager';
import { MMKV } from '../utils/mmkv';
import { scale, updateSize } from '../utils/SizeUtils';
import Notifications from './Notifications';

export const defaultSettings = {
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
  reduceAnimations: false
};

let settings = { ...defaultSettings };

let appLoaded = false;

function setAppLoaded() {
  appLoaded = true;
}

function getApploaded() {
  return appLoaded;
}

async function init() {
  scale.fontScale = 1;
  settings = await MMKV.getItem('appSettings');
  if (!settings) {
    settings = defaultSettings;
    await MMKV.setItem('appSettings', JSON.stringify(settings));
  } else {
    settings = JSON.parse(settings);
    if (!settings.appLockMode) {
      settings.appLockMode = 'none';
    }
    // eslint-disable-next-line no-prototype-builtins
    if (!settings.hasOwnProperty('telemetry')) {
      settings.telemetry = true;
    }
    if (!settings.notesListMode) {
      settings.notesListMode = 'normal';
    }
    if (!settings.notebooksListMode) {
      settings.notebooksListMode = 'normal';
    }
  }
  if (settings.notifNotes) {
    Notifications.pinQuickNote(true);
  }

  if (settings.fontScale) {
    scale.fontScale = settings.fontScale;
  }
  if (settings.privacyScreen || settings.appLockMode === 'background') {
    if (Platform.OS === 'android') {
      AndroidModule.setSecureMode(true);
    } else {
      enabled(true);
    }
  } else {
    if (Platform.OS === 'android') {
      AndroidModule.setSecureMode(false);
    } else {
      enabled(false);
    }
  }

  updateSize();
  useSettingStore.getState().setSettings({ ...settings });
  setTheme();
  return;
}

const setTheme = async () => {
  if (settings) {
    let newColors = await getColorScheme(settings.useSystemTheme);
    updateEvent({ type: Actions.THEME, colors: newColors });
  }
};

async function set(name, value) {
  settings[name] = value;
  settings = { ...settings };
  await MMKV.setItem('appSettings', JSON.stringify(settings));
  useSettingStore.getState().setSettings({ ...settings });
}

function get() {
  return { ...settings };
}

export default {
  init,
  setTheme,
  set,
  get,
  setAppLoaded,
  getApploaded
};
