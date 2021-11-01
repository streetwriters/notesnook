const {MMKV} = require('../utils/MMKV');
import storage from '../utils/storage';
import {db} from '../utils/database';
import {eSendEvent, ToastEvent} from './EventManager';
import SettingsService from './SettingsService';
import {eCloseProgressDialog, eOpenProgressDialog} from '../utils/Events';
import Share from 'react-native-share';
import {Platform} from 'react-native';
import {sanitizeFilename} from '../utils/filename';
import * as ScopedStorage from 'react-native-scoped-storage';
import {presentDialog} from '../components/Dialog/functions';
import FileViewer from 'react-native-file-viewer';

const MS_DAY = 86400000;
const MS_WEEK = MS_DAY * 7;

async function getDirectoryAndroid() {
  let folder = await ScopedStorage.openDocumentTree(true);
  if (!folder) return null;
  let subfolder;
  if (folder.name !== 'Notesnook backups') {
    subfolder = await ScopedStorage.createDirectory(
      folder.uri,
      'Notesnook backups'
    );
  } else {
    subfolder = folder;
  }
  MMKV.setItem('backupStorageDir', JSON.stringify(subfolder));
  return subfolder;
}

async function checkBackupDirExists() {
  if (Platform.OS === 'ios') return true;
  let dir = await MMKV.getItem('backupStorageDir');
  if (dir) {
    dir = JSON.parse(dir);
    let allDirs = await ScopedStorage.getPersistedUriPermissions();
    let exists = allDirs.findIndex(d => {
      return d === dir.uri || dir.uri.includes(d);
    });
    exists = exists !== -1;
    dir = exists ? dir : null;
  }
  if (!dir) {
    dir = await new Promise(resolve => {
      presentDialog({
        title: 'Select backup folder',
        paragraph:
          'Please select the folder where you would like to store backup files.',
        positivePress: async () => {
          resolve(await getDirectoryAndroid());
        },
        positiveText: 'Open file manager'
      });
    });
  }

  return dir;
}

let RNFetchBlob;
async function run() {
  let androidBackupDirectory = await checkBackupDirExists();
  if (!androidBackupDirectory) return;

  RNFetchBlob = require('rn-fetch-blob').default;
  eSendEvent(eOpenProgressDialog, {
    title: 'Backing up your data',
    paragraph:
      "All your backups are stored in 'Phone Storage/Notesnook/backups/' folder"
  });
  let backup;
  let error;
  try {
    backup = await db.backup.export(
      'mobile',
      SettingsService.get().encryptedBackup
    );
  } catch (e) {
    error = true;
  }

  if (!error) {
    try {
      let backupName = 'notesnook_backup_' + Date.now();
      backupName = sanitizeFilename(backupName, {replacement: '_'});
      backupName = backupName + '.nnbackup';
      let path;
      let backupFilePath;
      if (Platform.OS === 'ios') {
        path = await storage.checkAndCreateDir('/backups/');
        await RNFetchBlob.fs.writeFile(path + backupName, backup, 'utf8');
        backupFilePath = path + backupName;
      } else {
        backupFilePath = await ScopedStorage.writeFile(
          androidBackupDirectory.uri,
          backupName,
          'nnbackup/json',
          backup,
          'utf8',
          false
        );
      }
      await MMKV.setItem('backupDate', JSON.stringify(Date.now()));
      await MMKV.setItem(
        'askForBackup',
        JSON.stringify({
          timestamp: Date.now() + 86400000 * 3
        })
      );

      ToastEvent.show({
        heading: 'Backup successful',
        message: 'Your backup is stored in Notesnook folder on your phone.',
        type: 'success',
        context: 'global'
      });

      eSendEvent(eOpenProgressDialog, {
        title: 'Backup complete',
        icon: 'cloud-upload',
        paragraph:
          'Share your backup to your cloud storage such as Dropbox or Google Drive so you do not lose it.',
        noProgress: true,
        actionText: 'Share backup',
        actionsArray: [
          {
            action: () => {
              if (Platform.OS === 'ios') {
                Share.open({
                  url: 'file:/' + backupFilePath,
                  failOnCancel: false
                }).catch(console.log);
              } else {
                FileViewer.open(backupFilePath, {
                  showOpenWithDialog: true,
                  showAppsSuggestions: true,
                  shareFile: true
                }).catch(console.log);
              }
            },
            actionText: 'Share'
          }
        ]
      });
      console.log(backupFilePath);
      return backupFilePath;
    } catch (e) {
      console.log('backup error: ', e);
      eSendEvent(eCloseProgressDialog);
    }
  } else {
    eSendEvent(eCloseProgressDialog);
    ToastEvent.show({
      heading: 'Backup failed',
      type: 'error',
      context: 'local'
    });

    return null;
  }
}

async function getLastBackupDate() {
  return await MMKV.getItem('backupDate');
}

async function checkBackupRequired(type) {
  if (type === 'off') return;
  let now = Date.now();
  let lastBackupDate = await getLastBackupDate();
  if (!lastBackupDate || lastBackupDate === 'never') {
    return true;
  }
  lastBackupDate = parseInt(lastBackupDate);

  if (type === 'daily' && lastBackupDate + MS_DAY < now) {
    console.log('daily');
    return true;
  } else if (type === 'weekly' && lastBackupDate + MS_WEEK < now) {
    console.log('weekly');
    return true;
  } else {
    console.log('no need', lastBackupDate);
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
  getDirectoryAndroid,
  checkBackupDirExists
};
