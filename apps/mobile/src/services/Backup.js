const {MMKV} = require('../utils/MMKV');
import RNFetchBlob from 'rn-fetch-blob';
import storage from '../utils/storage';
import {db} from '../utils/DB';
import {ToastEvent} from './EventManager';

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
    backup = await db.backup.export('mobile');
  } catch (e) {
    console.log('error', e);
    error = true;
  }
  if (!error) {
    let backupName = 'notesnook_backup_' + new Date().toString() + '.nnbackup';
    let path = await storage.checkAndCreateDir('/backups/');
    await RNFetchBlob.fs.writeFile(path + backupName, backup, 'utf8');
    await MMKV.setItem('backupDate', JSON.stringify(Date.now()));
    setTimeout(() => {
      ToastEvent.show('Backup complete!', 'success');
    }, 1000);
    return path;
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
  if (lastBackupDate === 'never') {
    return true;
  }
  lastBackupDate = parseInt(lastBackupDate);

  if (type === 'daily') {
    now = new Date(now);
    lastBackupDate = new Date(lastBackupDate);
    if (now.getUTCDate() > lastBackupDate.getUTCDate()) {
      return true;
    } else if (
      (now.getUTCDate() === lastBackupDate.getUTCDate() &&
        now.getUTCFullYear() > lastBackupDate.getUTCFullYear()) ||
      now.getUTCMonth() > lastBackupDate.getUTCMonth()
    ) {
      return true;
    } else {
      return false;
    }
  } else if (type === "weekly") {
    if (lastBackupDate + MS_WEEK < now) {
      return true;
    } else {
      false;
    }
  } else {
    console.log("Backups are disabled");
  }
}

export default {
  checkBackupRequired,
  run,
};
