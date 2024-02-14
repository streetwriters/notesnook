/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import FileViewer from "react-native-file-viewer";
import * as ScopedStorage from "react-native-scoped-storage";
import Share from "react-native-share";
import { DatabaseLogger, db } from "../common/database";
import storage from "../common/database/storage";
import { presentDialog } from "../components/dialog/functions";
import { eCloseSheet } from "../utils/events";
import { sleep } from "../utils/time";
import { ToastManager, eSendEvent, presentSheet } from "./event-manager";
import SettingsService from "./settings";
import { cacheDir, copyFileAsync } from "../common/filesystem/utils";
import { zip } from "react-native-zip-archive";

const MS_DAY = 86400000;
const MS_WEEK = MS_DAY * 7;
const MONTH = MS_DAY * 30;

async function getDirectoryAndroid() {
  let folder = await ScopedStorage.openDocumentTree(true);
  if (!folder) return null;
  let subfolder;
  if (!folder.name.includes("Notesnook backups")) {
    let folderFiles = await ScopedStorage.listFiles(folder.uri);
    for (let f of folderFiles) {
      if (f.type === "directory" && f.name === "Notesnook backups") {
        subfolder = f;
      }
    }
    if (!subfolder) {
      subfolder = await ScopedStorage.createDirectory(
        folder.uri,
        "Notesnook backups"
      );
    }
  } else {
    subfolder = folder;
  }
  SettingsService.set({
    backupDirectoryAndroid: subfolder
  });
  return subfolder;
}

async function checkBackupDirExists(reset = false, context = "global") {
  if (Platform.OS === "ios") return true;
  let dir = SettingsService.get().backupDirectoryAndroid;
  if (reset) dir = null;
  if (dir) {
    let allDirs = await ScopedStorage.getPersistedUriPermissions();
    let exists = allDirs.findIndex((d) => {
      return d === dir.uri || dir.uri.includes(d);
    });
    exists = exists !== -1;
    dir = exists ? dir : null;
  }
  if (!dir) {
    // eslint-disable-next-line no-async-promise-executor
    dir = await new Promise(async (resolve) => {
      if (reset) {
        resolve(await getDirectoryAndroid());
        return;
      }
      presentDialog({
        title: "Select backup folder",
        paragraph:
          "Please select a folder where you would like to store backup files.",
        positivePress: async () => {
          resolve(await getDirectoryAndroid());
        },
        onClose: () => {
          resolve(null);
        },
        positiveText: "Select",
        context: context
      });
    });
  }

  return dir;
}

async function presentBackupCompleteSheet(backupFilePath) {
  presentSheet({
    title: "Backup complete",
    icon: "cloud-upload",
    paragraph: `${
      Platform.OS === "android"
        ? 'Backup file saved in "Notesnook backups" folder on your phone'
        : "Backup file is saved in File Manager/Notesnook folder"
    }. Share your backup to your cloud so you do not lose it.`,
    actionText: "Share backup",
    actionsArray: [
      {
        action: () => {
          if (Platform.OS === "ios") {
            Share.open({
              url: backupFilePath,
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
        actionText: "Share"
      },
      {
        action: async () => {
          eSendEvent(eCloseSheet);
          SettingsService.set({
            showBackupCompleteSheet: false
          });
        },
        actionText: "Never ask again",
        type: "grayBg"
      }
    ]
  });
}

async function updateNextBackupTime() {
  SettingsService.set({
    nextBackupRequestTime: Date.now() + 86400000 * 3,
    lastBackupDate: Date.now()
  });
}
/**
 *
 * @param {boolean} progress
 * @param {string} context
 * @returns {Promise<{path?: string, error?: Error}}>
 */
async function run(progress, context) {
  let androidBackupDirectory = await checkBackupDirExists(false, context);
  if (!androidBackupDirectory)
    return {
      error: new Error("Backup directory not selected")
    };

  if (progress) {
    presentSheet({
      title: "Backing up your data",
      paragraph:
        "All your backups are stored in 'Phone Storage/Notesnook/backups/' folder",
      progress: true
    });
  }

  let path;
  let backupFilePath;
  let backupFileName = "notesnook_backup_" + Date.now();

  if (Platform.OS === "ios") {
    path = await storage.checkAndCreateDir("/backups/");
  }

  const zipSourceFolder = `${cacheDir}/${backupFileName}`;
  const zipOutputFile =
    Platform.OS === "ios"
      ? `${path}/${backupFileName}.nnbackupz`
      : `${cacheDir}/${backupFileName}.nnbackupz`;

  if (await RNFetchBlob.fs.exists(zipSourceFolder))
    await RNFetchBlob.fs.unlink(zipSourceFolder);

  await RNFetchBlob.fs.mkdir(zipSourceFolder);

  try {
    for await (const file of db.backup.export(
      "mobile",
      SettingsService.get().encryptedBackup
    )) {
      console.log("Writing backup chunk of size...", file?.data?.length);
      await RNFetchBlob.fs.writeFile(
        `${zipSourceFolder}/${file.path}`,
        file.data,
        "utf8"
      );
    }

    await zip(zipSourceFolder, zipOutputFile);

    console.log("Final zip:", await RNFetchBlob.fs.stat(zipOutputFile));

    if (Platform.OS === "android") {
      // Move the zip to user selected directory.
      const file = await ScopedStorage.createFile(
        androidBackupDirectory.uri,
        `${backupFileName}.nnbackupz`,
        "application/nnbackupz"
      );
      await copyFileAsync(`file://${zipOutputFile}`, file.uri);
      path = file.uri;
    } else {
      path = zipOutputFile;
    }
    RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
    updateNextBackupTime();

    let showBackupCompleteSheet =
      progress && SettingsService.get().showBackupCompleteSheet;

    if (context)
      return {
        path: path
      };

    await sleep(300);
    if (showBackupCompleteSheet) {
      presentBackupCompleteSheet(backupFilePath);
    } else {
      progress && eSendEvent(eCloseSheet);
    }

    ToastManager.show({
      heading: "Backup successful",
      message: "Your backup is stored in Notesnook folder on your phone.",
      type: "success",
      context: "global"
    });

    return {
      path: path
    };
  } catch (e) {
    ToastManager.error(e, "Backup failed", context || "global");
    DatabaseLogger.error("Backup failed", e);
    await sleep(300);
    progress && eSendEvent(eCloseSheet);
    return {
      error: e
    };
  }
}

async function getLastBackupDate() {
  return SettingsService.get().lastBackupDate;
}

async function checkBackupRequired(type) {
  if (type === "off" || type === "useroff") return;
  let now = Date.now();
  let lastBackupDate = await getLastBackupDate();
  if (!lastBackupDate || lastBackupDate === "never") {
    return true;
  }
  lastBackupDate = parseInt(lastBackupDate);
  if (type === "daily" && lastBackupDate + MS_DAY < now) {
    DatabaseLogger.info("Daily backup started");
    return true;
  } else if (type === "weekly" && lastBackupDate + MS_WEEK < now) {
    DatabaseLogger.info("Weekly backup started");
    return true;
  } else if (type === "monthly" && lastBackupDate + MONTH < now) {
    DatabaseLogger.info("Monthly backup started");
    return true;
  }
  return false;
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

const BackupService = {
  checkBackupRequired,
  run,
  checkAndRun,
  getDirectoryAndroid,
  checkBackupDirExists
};

export default BackupService;
