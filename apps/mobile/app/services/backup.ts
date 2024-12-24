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

import { sanitizeFilename } from "@notesnook/common";
import { formatDate } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import FileViewer from "react-native-file-viewer";
import * as ScopedStorage from "react-native-scoped-storage";
import Share from "react-native-share";
import { zip } from "react-native-zip-archive";
import { DatabaseLogger, db } from "../common/database";
import filesystem, { FileStorage } from "../common/filesystem";
import { cacheDir, copyFileAsync } from "../common/filesystem/utils";
import { presentDialog } from "../components/dialog/functions";
import { endProgress, updateProgress } from "../components/dialogs/progress";
import { eCloseSheet } from "../utils/events";
import { sleep } from "../utils/time";
import { ToastManager, eSendEvent, presentSheet } from "./event-manager";
import SettingsService from "./settings";

const MS_DAY = 86400000;
const MS_WEEK = MS_DAY * 7;
const MONTH = MS_DAY * 30;

async function getDirectoryAndroid() {
  const folder = await ScopedStorage.openDocumentTree(true);
  if (!folder) return null;
  let subfolder;
  if (!folder.name.includes("Notesnook backups")) {
    const files = await ScopedStorage.listFiles(folder.uri);
    for (const file of files) {
      if (file.type === "directory" && file.name === "Notesnook backups") {
        subfolder = file;
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
    const allDirs = await ScopedStorage.getPersistedUriPermissions();
    let exists = allDirs.findIndex((d) => {
      return d === dir?.uri || dir?.uri.includes(d);
    }) as number | boolean;
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
      const desc = strings.selectBackupDirDesc(
        SettingsService.get().backupDirectoryAndroid?.path || ""
      );

      presentDialog({
        title: strings.selectBackupDir(),
        paragraph: desc[0] + " " + desc,
        positivePress: async () => {
          resolve(await getDirectoryAndroid());
        },
        onClose: () => {
          resolve(null);
        },
        positiveText: strings.select(),
        context: context
      });
    });
  }

  return dir;
}

async function presentBackupCompleteSheet(backupFilePath: string) {
  presentSheet({
    title: strings.backupComplete(),
    icon: "cloud-upload",
    paragraph: strings.backupSaved(Platform.OS),
    actionText: strings.shareBackup(),
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
            } as any).catch(console.log);
          }
        },
        actionText: strings.share()
      },
      {
        action: async () => {
          eSendEvent(eCloseSheet);
          SettingsService.set({
            showBackupCompleteSheet: false
          });
        },
        actionText: strings.neverAskAgain(),
        type: "secondary"
      }
    ]
  });
}

async function updateNextBackupTime(type: "full" | "partial") {
  SettingsService.set({
    nextBackupRequestTime: Date.now() + 86400000 * 3,
    [type === "full" ? "lastFullBackupDate" : "lastBackupDate"]: Date.now()
  });
}
/**
 * @param {boolean=} progress
 * @param {string=} context
 * @returns {Promise<{path?: string, error?: Error, report?: boolean}}>
 */
async function run(
  progress = false,
  context?: string,
  backupType: "full" | "partial" = "partial"
) {
  console.log("Creating backup:", backupType, progress, context);

  const androidBackupDirectory = (await checkBackupDirExists(
    false,
    context
  )) as ScopedStorage.FileType;

  if (!androidBackupDirectory)
    return {
      error: new Error(strings.backupDirectoryNotSelected()),
      report: false
    };

  let path;

  if (Platform.OS === "ios") {
    path = await filesystem.checkAndCreateDir("/backups");
  }

  const backupFileName = sanitizeFilename(
    `${formatDate(Date.now(), {
      type: "date-time",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24-hour"
    })}-${new Date().getSeconds()}${backupType === "full" ? "-full" : ""}`,
    { replacement: "-" }
  );

  if (progress) {
    presentSheet({
      title: strings.backingUpData(backupType),
      paragraph: strings.backupDataDesc(),
      progress: true
    });
  }

  const zipSourceFolder = `${cacheDir}/backup_temp`;
  const zipOutputFile =
    Platform.OS === "ios"
      ? `${path}/${backupFileName}.nnbackupz`
      : `${cacheDir}/${backupFileName}.nnbackupz`;

  await RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
  await RNFetchBlob.fs.mkdir(zipSourceFolder);

  const attachmentsDir = zipSourceFolder + "/attachments";
  if (backupType === "full") {
    await RNFetchBlob.fs.mkdir(attachmentsDir);
  }

  try {
    const user = await db.user.getUser();
    for await (const file of db.backup.export({
      type: "mobile",
      encrypt: SettingsService.get().encryptedBackup && !!user,
      mode: backupType
    })) {
      if (file.type === "file") {
        updateProgress({
          progress: `Writing backup chunk of size... ${file?.data?.length}`
        });
        await RNFetchBlob.fs.writeFile(
          `${zipSourceFolder}/${file.path}`,
          file.data,
          "utf8"
        );
      } else if (file.type === "attachment") {
        updateProgress({
          progress: `Saving attachments in backup... ${file.hash}`
        });
        if (await FileStorage.exists(file.hash)) {
          await RNFetchBlob.fs.cp(
            `${cacheDir}/${file.hash}`,
            `${attachmentsDir}/${file.hash}`
          );
        }
      }
    }

    updateProgress({
      progress: "Creating backup zip file..."
    });

    await zip(zipSourceFolder, zipOutputFile);

    if (Platform.OS === "android") {
      // Move the zip to user selected directory.
      const file = await ScopedStorage.createFile(
        androidBackupDirectory?.uri,
        `${backupFileName}.nnbackupz`,
        "application/nnbackupz"
      );
      console.log("Copying zip file...");
      await copyFileAsync(`file://${zipOutputFile}`, file.uri);

      console.log("Copied zip file...");
      path = file.uri;
    } else {
      path = zipOutputFile;
    }

    RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
    if (Platform.OS === "android") {
      RNFetchBlob.fs.unlink(zipOutputFile).catch(console.log);
    }

    updateNextBackupTime(backupType || "partial");

    if (progress) {
      endProgress();
    }

    const canShowCompletionStatus =
      progress && SettingsService.get().showBackupCompleteSheet;

    if (context) {
      return {
        path: path
      };
    }

    await sleep(300);

    if (canShowCompletionStatus) {
      presentBackupCompleteSheet(path);
    }

    ToastManager.show({
      heading: strings.backupSuccess(),
      type: "success",
      context: "global"
    });

    return {
      path: path
    };
  } catch (e) {
    ToastManager.error(e as Error, strings.backupFailed(), context || "global");

    if (
      (e as Error)?.message?.includes("android.net.Uri") &&
      androidBackupDirectory
    ) {
      SettingsService.setProperty("backupDirectoryAndroid", null);
      return run(progress, context, backupType);
    }

    RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
    if (Platform.OS === "android") {
      RNFetchBlob.fs.unlink(zipOutputFile).catch(console.log);
    }

    DatabaseLogger.error(e);
    await sleep(300);
    if (progress) {
      endProgress();
    }
    return {
      error: e,
      report: true
    };
  }
}

async function checkBackupRequired(
  type: "daily" | "off" | "useroff" | "weekly" | "monthly" | "never",
  lastBackupDateType: "lastBackupDate" | "lastFullBackupDate" = "lastBackupDate"
) {
  console.log(lastBackupDateType, type);
  if (type === "off" || type === "useroff" || type === "never" || !type) return;
  const now = Date.now();
  const lastBackupDate = SettingsService.getProperty(lastBackupDateType) as
    | number
    | "never";

  if (
    lastBackupDate === undefined ||
    lastBackupDate === "never" ||
    lastBackupDate === 0
  ) {
    return true;
  }

  if (type === "daily" && lastBackupDate + MS_DAY < now) {
    DatabaseLogger.info(`Daily backup started: ${type}`);
    return true;
  } else if (type === "weekly" && lastBackupDate + MS_WEEK < now) {
    DatabaseLogger.info(`Weekly backup started: ${type}`);
    return true;
  } else if (type === "monthly" && lastBackupDate + MONTH < now) {
    DatabaseLogger.info(`Monthly backup started: ${type}`);
    return true;
  }
  return false;
}

const checkAndRun = async () => {
  const settings = SettingsService.get();
  if (await checkBackupRequired(settings?.reminder)) {
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
