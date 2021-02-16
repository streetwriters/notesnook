const {MMKV} = require('../utils/MMKV');
import storage from '../utils/storage';
import {db} from '../utils/DB';
import {eSendEvent, ToastEvent} from './EventManager';
import SettingsService from './SettingsService';
import {eCloseProgressDialog, eOpenProgressDialog} from '../utils/Events';
import Share from 'react-native-share';

const MS_DAY = 86400000;
const MS_WEEK = MS_DAY * 7;
let RNFetchBlob;
async function run() {
  if (Platform.OS === 'android') {
    let granted = await storage.requestPermission();
    if (!granted) {
      ToastEvent.show('Backup failed! Storage access was denied.');
      return;
    }
  }
  RNFetchBlob = require('rn-fetch-blob').default
  eSendEvent(eOpenProgressDialog, {
    title: 'Backing up your data',
    paragraph:
      "All your backups are stored in 'Phone Storage/Notesnook/backups/' folder",
  });
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
      let backupName = 'notesnook_backup_' + Date.now() + '.nnbackup';
      let path = await storage.checkAndCreateDir('backups/');
      await RNFetchBlob.fs.createFile(path + backupName, backup, 'utf8');
      await MMKV.setItem('backupDate', JSON.stringify(Date.now()));
      ToastEvent.show('Backup complete!', 'success');
  
      eSendEvent(eOpenProgressDialog, {
        title: 'Backup complete',
        icon: 'cloud-upload',
        paragraph:
          'Share your backup to your cloud storage such as Dropbox or Google Drive.',
        noProgress: true,
        actionText: 'Share Backup File',
        actionsArray: [
          {
            action: () => {
              Share.open({
                url: 'file:/' + path + backupName,
                title: 'Save Backup to Cloud',
                message: 'Saving backup file to cloud storage',
              }).catch((e) => console.log);
            },
            actionText: 'Share Backup File',
          },
        ],
      });

      return path + backupName;
    } catch (e) {
      console.log('backup error', e);
      eSendEvent(eCloseProgressDialog);
    }
  } else {
    eSendEvent(eCloseProgressDialog);
    ToastEvent.show('Backup failed!', 'success');
    return null;
  }
}

async function getLastBackupDate() {
  return await MMKV.getItem('backupDate');
}

async function checkBackupRequired(type) {
  if (type === "off") return;
  let now = Date.now();
  let lastBackupDate = await getLastBackupDate();
  if (!lastBackupDate || lastBackupDate === 'never') {
    return true;
  }
  lastBackupDate = parseInt(lastBackupDate);

  if (type === 'daily' && lastBackupDate + MS_DAY < now) {
    console.log("daily")
    return true;
  } else if (type === 'weekly' && lastBackupDate + MS_WEEK < now) {
    console.log("weekly")
    return true;
  } else {
    console.log("no need",lastBackupDate);
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
