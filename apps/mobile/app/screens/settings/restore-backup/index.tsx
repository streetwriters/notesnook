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

import { formatBytes, getFormattedDate } from "@notesnook/common";
import { LegacyBackupFile } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, View } from "react-native";
import RNFetchBlob, { ReactNativeBlobUtilStat } from "react-native-blob-util";
import DocumentPicker from "react-native-document-picker";
import * as ScopedStorage from "react-native-scoped-storage";
import { unzip } from "react-native-zip-archive";
import { DatabaseLogger, db } from "../../../common/database";
import filesystem from "../../../common/filesystem";
import { deleteCacheFileByName } from "../../../common/filesystem/io";
import { cacheDir, copyFileAsync } from "../../../common/filesystem/utils";
import { presentDialog } from "../../../components/dialog/functions";
import {
  endProgress,
  startProgress,
  updateProgress
} from "../../../components/dialogs/progress";
import { Button } from "../../../components/ui/button";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { SectionItem } from "../../../screens/settings/section-item";
import { ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import SettingsService from "../../../services/settings";
import { refreshAllStores } from "../../../stores/create-db-collection-store";
import { useUserStore } from "../../../stores/use-user-store";
import { SIZE } from "../../../utils/size";

type PasswordOrKey = { password?: string; encryptionKey?: string };

const withPassword = () => {
  return new Promise<PasswordOrKey>((resolve) => {
    let resolved = false;
    presentDialog({
      context: "local",
      title: strings.backupEncrypted(),
      input: true,
      inputPlaceholder: strings.password(),
      paragraph: strings.backupEnterPassword(),
      positiveText: strings.restore(),
      secureTextEntry: true,
      onClose: () => {
        if (resolved) return;
        resolve({});
      },
      negativeText: strings.cancel(),
      positivePress: async (password, isEncryptionKey) => {
        resolve({
          encryptionKey: isEncryptionKey ? password : undefined,
          password: isEncryptionKey ? undefined : password
        });
        resolved = true;
        return true;
      },
      check: {
        info: strings.useEncryptionKey(),
        type: "transparent"
      }
    });
  });
};

const restoreBackup = async (options: {
  uri: string;
  deleteFile?: boolean;
}) => {
  try {
    const isLegacyBackup = options.uri.endsWith(".nnbackup");

    startProgress({
      title: strings.restoring(),
      paragraph: strings.preparingBackupRestore(),
      canHideProgress: false
    });

    let filePath = options.uri;
    let deleteBackupFile = options.deleteFile;

    if (!isLegacyBackup) {
      if (Platform.OS === "android") {
        updateProgress({
          progress: strings.copyingBackupFileToCache()
        });
        const cacheFile = `file://${RNFetchBlob.fs.dirs.CacheDir}/backup.zip`;
        if (await RNFetchBlob.fs.exists(cacheFile)) {
          await RNFetchBlob.fs.unlink(cacheFile);
        }

        await RNFetchBlob.fs.createFile(cacheFile, "", "utf8");
        if (filePath.startsWith("content://")) {
          await copyFileAsync(filePath, cacheFile);
        } else {
          await RNFetchBlob.fs.cp(filePath, cacheFile);
        }
        filePath = cacheFile;
        deleteBackupFile = true;
      }

      const zipOutputFolder = `${cacheDir}/backup_extracted`;
      if (await RNFetchBlob.fs.exists(zipOutputFolder)) {
        await RNFetchBlob.fs.unlink(zipOutputFolder);
        await RNFetchBlob.fs.mkdir(zipOutputFolder);
      }
      updateProgress({
        progress: strings.extractingFiles()
      });
      await unzip(filePath, zipOutputFolder);

      const extractedBackupFiles = await RNFetchBlob.fs.ls(zipOutputFolder);

      const extractedAttachments = extractedBackupFiles.includes("attachments")
        ? await RNFetchBlob.fs.ls(`${zipOutputFolder}/attachments`)
        : [];

      const attachmentsKeyPath: any = extractedAttachments?.find(
        (path) => path === ".attachments_key"
      );
      const attachmentsKey = attachmentsKeyPath
        ? await JSON.parse(
            await RNFetchBlob.fs.readFile(
              `${zipOutputFolder}/attachments/${attachmentsKeyPath}`,
              "utf8"
            )
          )
        : undefined;

      let count = 0;
      await db.transaction(async () => {
        let passwordOrKey: PasswordOrKey;
        for (const path of extractedBackupFiles) {
          if (path === ".nnbackup" || path === "attachments") continue;

          updateProgress({
            progress: `${strings.restoringBackup()} (${count++}/${
              extractedBackupFiles.length
            })`
          });

          const filePath = `${zipOutputFolder}/${path}`;
          const data = await RNFetchBlob.fs.readFile(filePath, "utf8");
          const backup = JSON.parse(data);

          const isEncryptedBackup = backup.encrypted;

          passwordOrKey = !isEncryptedBackup
            ? ({} as PasswordOrKey)
            : await withPassword();

          if (
            isEncryptedBackup &&
            !passwordOrKey?.encryptionKey &&
            !passwordOrKey?.password
          ) {
            endProgress();
            throw new Error(strings.failedToDecryptBackup());
          }

          await db.backup.import(backup, {
            ...passwordOrKey,
            attachmentsKey: attachmentsKey
          });
        }
      });

      await db.initCollections();
      count = 0;
      for (const path of extractedAttachments) {
        if (path === ".attachments_key") continue;
        updateProgress({
          progress: `Restoring attachments (${count++}/${
            extractedAttachments.length
          })`
        });
        const hash = path;
        const attachment = await db.attachments.attachment(hash as string);
        if (!attachment) continue;

        console.log("Saving attachment file", hash);
        await deleteCacheFileByName(hash);
        await RNFetchBlob.fs.cp(
          `${zipOutputFolder}/attachments/${hash}`,
          `${cacheDir}/${hash}`
        );
      }
      updateProgress({
        progress: strings.cleaningUp()
      });
      // Remove files from cache
      RNFetchBlob.fs.unlink(zipOutputFolder).catch(console.log);
      if (Platform.OS === "android" || deleteBackupFile) {
        RNFetchBlob.fs.unlink(filePath).catch(console.log);
      }
    } else {
      updateProgress({
        progress: strings.readingBackupFile()
      });
      const rawData =
        Platform.OS === "android"
          ? await ScopedStorage.readFile(filePath, "utf8")
          : await RNFetchBlob.fs.readFile(filePath, "utf8");
      const backup: LegacyBackupFile = JSON.parse(rawData) as LegacyBackupFile;

      const isEncryptedBackup =
        typeof backup.data !== "string" && backup.data.cipher;

      updateProgress({
        progress: isEncryptedBackup
          ? strings.decryptingBackup()
          : strings.preparingBackupRestore()
      });

      const { encryptionKey, password } = isEncryptedBackup
        ? ({} as PasswordOrKey)
        : await withPassword();

      if (isEncryptedBackup && !encryptionKey && !password) {
        endProgress();
        throw new Error(strings.failedToDecryptBackup());
      }

      await db.transaction(async () => {
        updateProgress({
          progress: strings.restoringBackup()
        });
        await db.backup.import(backup, {
          encryptionKey,
          password
        });
      });
      endProgress();
    }

    ToastManager.show({
      heading: strings.backupRestored(),
      type: "success"
    });

    await db.initCollections();
    refreshAllStores();
    Navigation.queueRoutesForUpdate();
    endProgress();
  } catch (e) {
    endProgress();
    DatabaseLogger.error(e as Error);
    ToastManager.error(e as Error, strings.restoreFailed());
  }
};

const BACKUP_FILES_CACHE: (ReactNativeBlobUtilStat | ScopedStorage.FileType)[] =
  [];

export const RestoreBackup = () => {
  const { colors } = useThemeColors();
  const [files, setFiles] =
    useState<(ReactNativeBlobUtilStat | ScopedStorage.FileType)[]>(
      BACKUP_FILES_CACHE
    );
  const [loading, setLoading] = useState(true);
  const [backupDirectoryAndroid, setBackupDirectoryAndroid] =
    useState<ScopedStorage.FileType>();

  useEffect(() => {
    setTimeout(() => {
      checkBackups();
    }, 1000);
  }, []);

  const checkBackups = async () => {
    try {
      let files: (ReactNativeBlobUtilStat | ScopedStorage.FileType)[] = [];
      if (Platform.OS === "android") {
        const backupDirectory = SettingsService.get().backupDirectoryAndroid;
        if (backupDirectory) {
          setBackupDirectoryAndroid(backupDirectory);
          files = await ScopedStorage.listFiles(backupDirectory.uri);
        } else {
          setLoading(false);
          return;
        }
      } else {
        const path = await filesystem.checkAndCreateDir("/backups/");
        files = await RNFetchBlob.fs.lstat(path);
      }
      files = files
        .filter((file) => {
          const name =
            Platform.OS === "android"
              ? (file as ScopedStorage.FileType).name
              : (file as ReactNativeBlobUtilStat).filename;
          return name.endsWith(".nnbackup") || name.endsWith(".nnbackupz");
        })
        .sort(function (a, b) {
          const timeA = a.lastModified;
          const timeB = b.lastModified;
          return timeB - timeA;
        });

      setFiles(files);
      BACKUP_FILES_CACHE.splice(0, BACKUP_FILES_CACHE.length, ...files);
    } catch (e) {
      e;
    } finally {
      setLoading(false);
    }
  };

  const renderItem = React.useCallback(
    ({
      item,
      index
    }: {
      item: ReactNativeBlobUtilStat | ScopedStorage.FileType;
      index: number;
    }) => <BackupItem item={item} index={index} />,
    []
  );

  return (
    <>
      <FlatList
        data={[0]}
        renderItem={() => {
          return (
            <View>
              <SectionItem
                item={{
                  id: "restore-from-files",
                  name: strings.restoreFromFiles(),
                  icon: "folder",
                  modifer: async () => {
                    useUserStore.setState({
                      disableAppLockRequests: true
                    });
                    const file = await DocumentPicker.pickSingle({
                      copyTo: "cachesDirectory"
                    });

                    setTimeout(() => {
                      useUserStore.setState({
                        disableAppLockRequests: false
                      });
                    }, 1000);

                    restoreBackup({
                      uri:
                        Platform.OS === "android"
                          ? (("file://" + file.fileCopyUri) as string)
                          : (file.fileCopyUri as string),
                      deleteFile: true
                    });
                  },
                  description: strings.selectBackupFileDesc()
                }}
              />

              {Platform.OS === "android" ? (
                <SectionItem
                  item={{
                    id: "select-backup-folder",
                    name: strings.selectBackupFolder(),
                    icon: "folder",
                    modifer: async () => {
                      const folder = await ScopedStorage.openDocumentTree(true);
                      let subfolder;
                      if (folder.name !== "Notesnook backups") {
                        subfolder = await ScopedStorage.createDirectory(
                          folder.uri,
                          "Notesnook backups"
                        );
                      } else {
                        subfolder = folder;
                      }
                      SettingsService.set({
                        backupDirectoryAndroid: subfolder
                      });
                      setBackupDirectoryAndroid(subfolder);
                      setLoading(true);
                      checkBackups();
                    },
                    description: strings.selectFolderForBackupFilesDesc()
                  }}
                />
              ) : null}

              <FlatList
                ListHeaderComponent={
                  <View
                    style={{
                      backgroundColor: colors.primary.background,
                      marginBottom: 10
                    }}
                  >
                    <Heading color={colors.primary.accent} size={SIZE.xs}>
                      {strings.recentBackups()}
                    </Heading>
                  </View>
                }
                stickyHeaderIndices={[0]}
                ListEmptyComponent={
                  loading ? (
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        height: 300,
                        paddingHorizontal: 50
                      }}
                    >
                      <ActivityIndicator
                        color={colors.primary.accent}
                        size={SIZE.lg}
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 12,
                        height: 300,
                        paddingHorizontal: 50
                      }}
                    >
                      <Paragraph
                        style={{
                          textAlign: "center"
                        }}
                        color={colors.secondary.paragraph}
                      >
                        {strings.noBackupsFound()}.
                      </Paragraph>
                    </View>
                  )
                }
                windowSize={2}
                keyExtractor={(item) =>
                  (item as ScopedStorage.FileType).name ||
                  (item as ReactNativeBlobUtilStat).filename
                }
                style={{
                  paddingHorizontal: 12
                }}
                ListFooterComponent={
                  <View
                    style={{
                      height: 200
                    }}
                  />
                }
                data={files}
                renderItem={renderItem}
              />
            </View>
          );
        }}
      />
    </>
  );
};

const BackupItem = ({
  item,
  index
}: {
  item: ReactNativeBlobUtilStat | ScopedStorage.FileType;
  index: number;
}) => {
  const { colors } = useThemeColors();

  const isLegacyBackup =
    item.path?.endsWith(".nnbackup") ||
    (item as ScopedStorage.FileType).uri?.endsWith(".nnbackup");
  const itemName = (
    (item as ReactNativeBlobUtilStat).filename ||
    (item as ScopedStorage.FileType).name
  )
    .replace(".nnbackupz", "")
    .replace(".nnbackup", "");

  return (
    <View
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        borderRadius: 0,
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: colors.primary.border,
        paddingVertical: 12
      }}
    >
      <View>
        <Paragraph size={SIZE.sm}>{itemName}</Paragraph>
        <Paragraph
          size={SIZE.xs}
          color={colors.secondary.paragraph}
          style={{ width: "100%", maxWidth: "100%" }}
        >
          Created on {getFormattedDate(item?.lastModified, "date-time")}
          {isLegacyBackup ? "(Legacy backup)" : ""} (
          {formatBytes((item as ReactNativeBlobUtilStat).size)})
        </Paragraph>
      </View>
      <Button
        title="Restore"
        type="secondaryAccented"
        style={{
          paddingHorizontal: 12,
          height: 35
        }}
        onPress={() => {
          presentDialog({
            title: `${strings.restore()} ${itemName}`,
            paragraph: strings.restoreBackupConfirm(),
            positiveText: strings.restore(),
            negativeText: strings.cancel(),
            positivePress: async () => {
              restoreBackup({
                uri:
                  Platform.OS === "android"
                    ? (item as ScopedStorage.FileType).uri
                    : (item as ReactNativeBlobUtilStat).path
              });
            }
          });
        }}
      />
    </View>
  );
};
