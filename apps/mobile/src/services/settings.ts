import { Platform } from 'react-native';
import { enabled } from 'react-native-privacy-snapshot';
import { SettingStore } from '../stores/interfaces';
import { useSettingStore } from '../stores/stores';
import { AndroidModule } from '../utils';
import { getColorScheme } from '../utils/color-scheme/utils';
import { MMKV } from '../utils/database/mmkv';
import { scale, updateSize } from '../utils/size';
import Notifications from './notifications';
import Orientation from 'react-native-orientation';
import { DDS } from './device-detection';

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
    console.log('migrated askForRating', askForRating);
    MMKV.removeItem('askForRating');
  }

  let askForBackup = await MMKV.getItem('askForBackup');
  if (askForBackup) {
    askForBackup = JSON.parse(askForBackup);
    //@ts-ignore
    settings.rateApp = askForBackup.timestamp;
    MMKV.removeItem('askForBackup');
    console.log('migrated askForBackup', askForBackup);
  }

  let introCompleted = await MMKV.getItem('introCompleted');
  if (introCompleted) {
    settings.introCompleted = true;
    MMKV.removeItem('introCompleted');
    console.log('migrated introCompleted', introCompleted);
  }

  let lastBackupDate = await MMKV.getItem('backupDate');
  if (lastBackupDate) settings.lastBackupDate = parseInt(lastBackupDate);
  MMKV.removeItem('backupDate');
  console.log('migrated backupDate', lastBackupDate);

  let isUserEmailConfirmed = await MMKV.getItem('isUserEmailConfirmed');
  if (isUserEmailConfirmed === 'yes') settings.userEmailConfirmed = true;
  if (isUserEmailConfirmed === 'no') settings.userEmailConfirmed = false;
  console.log('migrated useEmailConfirmed', isUserEmailConfirmed);

  MMKV.removeItem('isUserEmailConfirmed');

  let userHasSavedRecoveryKey = await MMKV.getItem('userHasSavedRecoveryKey');
  if (userHasSavedRecoveryKey) settings.recoveryKeySaved = true;
  MMKV.removeItem('userHasSavedRecoveryKey');
  console.log('migrated userHasSavedRecoveryKey', userHasSavedRecoveryKey);

  let accentColor = await MMKV.getItem('accentColor');
  if (accentColor) settings.theme.accent = accentColor;
  MMKV.removeItem('accentColor');
  console.log('migrated accentColor', accentColor);

  let theme = await MMKV.getItem('theme');
  if (theme) {
    theme = JSON.parse(theme);
    //@ts-ignore
    if (theme.night) settings.theme.dark = true;
    MMKV.removeItem('theme');
  }

  console.log('migrated theme', theme);

  let backupStorageDir = await MMKV.getItem('backupStorageDir');
  if (backupStorageDir) settings.backupDirectoryAndroid = JSON.parse(backupStorageDir);
  MMKV.removeItem('backupStorageDir');
  console.log('migrated backupStorageDir', backupStorageDir);

  let dontShowCompleteSheet = await MMKV.getItem('dontShowCompleteSheet');
  if (dontShowCompleteSheet) settings.showBackupCompleteSheet = false;
  MMKV.removeItem('dontShowCompleteSheet');
  console.log('migrated dontShowCompleteSheet', dontShowCompleteSheet);

  settings.migrated = true;

  await set(settings);
  console.log('migrated completed');

  return true;
}

async function init() {
  scale.fontScale = 1;
  let settingsJson = await MMKV.getItem('appSettings');
  let settings = get();
  if (!settingsJson) {
    await MMKV.setItem('appSettings', JSON.stringify(settings));
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
  setPrivacyScreen(settings);
  updateSize();
  useSettingStore.getState().setSettings({ ...settings });
  await migrate(settings);
  getColorScheme();
  return;
}

async function setPrivacyScreen(settings: SettingStore['settings']) {
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

async function onFirstLaunch() {
  let introCompleted = get().introCompleted;
  if (!introCompleted) {
    await set({
      rateApp: Date.now() + 86400000 * 2,
      nextBackupRequestTime: Date.now() + 86400000 * 3
    });
  }
}

function checkOrientation() {
  //@ts-ignore
  Orientation.getOrientation((e, r) => {
    DDS.checkSmallTab(r);
    //@ts-ignore
    useSettingStore.getState().setDimensions({ width: DDS.width, height: DDS.height });
    useSettingStore
      .getState()
      .setDeviceMode(DDS.isLargeTablet() ? 'tablet' : DDS.isSmallTab ? 'smallTablet' : 'mobile');
  });
}

const SettingsService = {
  init,
  set,
  get,
  toggle,
  onFirstLaunch,
  checkOrientation
};

export default SettingsService;
