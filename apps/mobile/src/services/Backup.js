const {MMKV} = require('../utils/MMKV');
import RNFetchBlob from 'rn-fetch-blob';
import storage from '../utils/storage';
import {db} from '../utils/DB';

async function run() {
  if (Platform.OS === 'android') {
    let granted = await storage.requestPermission();
    if (!granted) {
      ToastEvent.show('Backup failed! Storage access was denied.');
      return;
    }
  }
  let backup;
  try {
    backup = await db.backup.export();
  } catch (e) {
    console.log('error', e);
  }

  let backupName = 'notesnook_backup_' + new Date().toString() + '.nnbackup';
  let path = await storage.checkAndCreateDir('/backups/');
  await RNFetchBlob.fs.writeFile(path + backupName, backup, 'utf8');
  await MMKV.setItem('backupDate', JSON.stringify(Date.now()));
  ToastEvent.show('Backup complete!', 'success');
  return path;
}

async function getLastBackupDate() {
  let date;
  try {
    date = await MMKV.getItem('backupDate');
  } catch (e) {
    date = 'never';
  }
  return date;
}
const MS_DAY = 86400000;
const MS_WEEK = MS_DAY * 7;

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
  } else {
    if (lastBackupDate + MS_WEEK < now) {
      return true;
    } else {
      false;
    }
  }
}

export default {
  checkBackupRequired,
  run,
};
