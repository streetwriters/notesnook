import { Platform, Settings } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import { SettingStore } from '../stores/interfaces';
import { useSettingStore } from '../stores/stores';
import { useThemeStore } from '../stores/theme';
import { AndroidModule } from '../utils';
import { getColorScheme } from '../utils/color-scheme/utils';
import { MMKV } from '../utils/database/mmkv';
import { scale, updateSize } from '../utils/size';
import Notifications from './notifications';

async function init() {
  scale.fontScale = 1;
  let settingsJson = await MMKV.getItem('appSettings');
  let settings = get();
  if (!settingsJson) {
    await MMKV.setItem('appSettings', JSON.stringify(settingsJson));
  } else {
    settings = JSON.parse(settingsJson);
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
  let settings = get();
  let newColors = await getColorScheme(settings.useSystemTheme);
  useThemeStore.getState().setColors({ ...newColors });
};

async function set(name: keyof SettingStore['settings'], value: any) {
  let settings = get();
  settings[name] = value;
  useSettingStore.getState().setSettings(settings);
  await MMKV.setItem('appSettings', JSON.stringify(settings));
}

function get() {
  return { ...useSettingStore.getState().settings };
}

const SettingsService = {
  init,
  setTheme,
  set,
  get
};

export default SettingsService;
