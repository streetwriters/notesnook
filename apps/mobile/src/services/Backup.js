const {MMKV} = require('../utils/MMKV');
import RNFetchBlob from 'rn-fetch-blob';
import storage from '../utils/storage';
import {db} from '../utils/DB';
import {ToastEvent} from './EventManager';
import SettingsService from './SettingsService';

const MS_DAY = 86400000;
const MS_WEEK = MS_DAY * 7;

async function run() {
  if (Platform.OS === 'android') {
    let granted = await storage.requestPermission();
    if (!granted) {
      ToastEvent.show('Backup failed! Storage access was denied.');
      return;
    }
  }
  let backup;
  let error;
  try {
    backup = await db.backup.export(
      'mobile',
      SettingsService.get().encryptedBackup,
    );
  } catch (e) {
    error = true;
  }
  if (!error) {
    try {
      let backupName =
        'notesnook_backup_' + Date.now() + '.nnbackup';
      let path = await storage.checkAndCreateDir('backups/');
      console.log(path + backupName);
      RNFetchBlob.fs
        .createFile(path + backupName, 'abc', 'utf8')
        .then(console.log)
        .catch(console.log);

      await MMKV.setItem('backupDate', JSON.stringify(Date.now()));
      setTimeout(() => {
        ToastEvent.show('Backup complete!', 'success');
      }, 1000);
      return path;
    } catch (e) {
      console.log('backup error', e);
    }
  } else {
    ToastEvent.show('Backup failed!', 'success');
    return null;
  }
}

async function getLastBackupDate() {
  return await MMKV.getItem('backupDate');
}

async function checkBackupRequired(type) {
  let now = Date.now();
  let lastBackupDate = await getLastBackupDate();
  if (!lastBackupDate) return false;
  if (lastBackupDate === 'never') {
    return true;
  }
  lastBackupDate = parseInt(lastBackupDate);

  if (type === 'daily' && lastBackupDate + MS_DAY < now) {
    return true;
  } else if (type === 'weekly' && lastBackupDate + MS_WEEK < now) {
    return true;
  } else {
    return false;
  }
}

const checkAndRun = async () => {
  let settings = SettingsService.get();
  if (await checkBackupRequired(settings.reminder)) {
    try {
      await run();
    } catch (e) {
      console.log(e);
    }
  }
};

export default {
  checkBackupRequired,
  run,
  checkAndRun,
};
