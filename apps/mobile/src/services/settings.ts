import { Platform } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import { SettingStore } from '../stores/interfaces';
import { useSettingStore } from '../stores/stores';
import { AndroidModule } from '../utils';
import { getColorScheme } from '../utils/color-scheme/utils';
import { MMKV } from '../utils/database/mmkv';
import { scale, updateSize } from '../utils/size';
import Notifications from './notifications';

async function migrate(settings: SettingStore['settings']) {
  if (settings.migrated) return true;

  let askForRating = await MMKV.getItem('askForRating');
  if (askForRating) {
    if (askForRating === 'completed' || askForRating === 'never') {
      settings.rateApp = false;
    } else {
      askForRating = JSON.parse(askForRating);
      //@ts-ignore
      settings.rateApp = askForRating.timestamp;
    }
    MMKV.removeItem('askForRating');
  }

  let askForBackup = await MMKV.getItem('askForBackup');
  if (askForBackup) {
    askForBackup = JSON.parse(askForBackup);
    //@ts-ignore
    settings.rateApp = askForBackup.timestamp;
    MMKV.removeItem('askForBackup');
  }

  let introCompleted = await MMKV.getItem('introCompleted');
  if (introCompleted) {
    settings.introCompleted = true;
    MMKV.removeItem('introCompleted');
  }

  let lastBackupDate = await MMKV.getItem('backupDate');
  if (lastBackupDate) settings.lastBackupDate = parseInt(lastBackupDate);
  MMKV.removeItem('backupDate');

  let isUserEmailConfirmed = await MMKV.getItem('isUserEmailConfirmed');
  if (isUserEmailConfirmed === 'yes') settings.userEmailConfirmed = true;
  if (isUserEmailConfirmed === 'no') settings.userEmailConfirmed = false;

  MMKV.removeItem('isUserEmailConfirmed');

  let userHasSavedRecoveryKey = await MMKV.getItem('userHasSavedRecoveryKey');
  if (userHasSavedRecoveryKey) settings.recoveryKeySaved = true;
  MMKV.removeItem('userHasSavedRecoveryKey');

  let accentColor = await MMKV.getItem('accentColor');
  if (accentColor) settings.theme.accent = accentColor;
  MMKV.removeItem('accentColor');

  let theme = await MMKV.getItem('theme');
  if (theme) {
    theme = JSON.parse(theme);
    //@ts-ignore
    if (theme.night) settings.theme.dark = true;
    MMKV.removeItem('theme');
  }

  let backupStorageDir = await MMKV.getItem('backupStorageDir');
  if (backupStorageDir) settings.backupDirectoryAndroid = JSON.parse(backupStorageDir);
  MMKV.removeItem('backupStorageDir');

  let dontShowCompleteSheet = await MMKV.getItem('dontShowCompleteSheet');
  if (dontShowCompleteSheet) settings.showBackupCompleteSheet = false;
  MMKV.removeItem('dontShowCompleteSheet');

  settings.migrated = true;

  await set(settings);

  return true;
}

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
  await migrate(settings);
  getColorScheme();
  return;
}

async function set(next: Partial<SettingStore['settings']>) {
  let settings = get();
  settings = {
    ...settings,
    ...next
  };
  useSettingStore.getState().setSettings(settings);
  await MMKV.setItem('appSettings', JSON.stringify(settings));
}

async function toggle(id: keyof SettingStore['settings']) {
  let settings = get();
  if (typeof settings[id] !== 'boolean') return;
  settings = {
    ...settings
  };
  //@ts-ignore
  settings[id] = !settings[id];
  useSettingStore.getState().setSettings(settings);
  await MMKV.setItem('appSettings', JSON.stringify(settings));
}

function get() {
  return { ...useSettingStore.getState().settings };
}

const SettingsService = {
  init,
  set,
  get,
  toggle
};

export default SettingsService;
