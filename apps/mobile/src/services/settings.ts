import { Platform } from 'react-native';
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
    settings = {
      ...settings,
      ...JSON.parse(settingsJson)
    };
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

async function set(next: Partial<SettingStore['settings']>) {
  let settings = get();
  settings = {
    ...settings,
    ...next
  };
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
