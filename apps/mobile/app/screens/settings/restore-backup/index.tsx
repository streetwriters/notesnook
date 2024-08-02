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

import Sodium from "@ammarahmed/react-native-sodium";
import { getFormattedDate } from "@notesnook/common";
import { LegacyBackupFile } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, View } from "react-native";
import RNFetchBlob, { ReactNativeBlobUtilStat } from "react-native-blob-util";
import DocumentPicker from "react-native-document-picker";
import * as ScopedStorage from "react-native-scoped-storage";
import { unzip } from "react-native-zip-archive";
import { DatabaseLogger, db } from "../../../common/database";
import storage from "../../../common/database/storage";
import { deleteCacheFileByName } from "../../../common/filesystem/io";
import { cacheDir, copyFileAsync } from "../../../common/filesystem/utils";
import { Dialog } from "../../../components/dialog";
import BaseDialog from "../../../components/dialog/base-dialog";
import DialogContainer from "../../../components/dialog/dialog-container";
import { presentDialog } from "../../../components/dialog/functions";
import { Button } from "../../../components/ui/button";
import { ProgressBarComponent } from "../../../components/ui/svg/lazy";
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
      title: "Encrypted backup",
      input: true,
      inputPlaceholder: "Password",
      paragraph: "Please enter password of this backup file",
      positiveText: "Restore",
      secureTextEntry: true,
      onClose: () => {
        if (resolved) return;
        resolve({});
      },
      negativeText: "Cancel",
      positivePress: async (password, isEncryptionKey) => {
        resolve({
          encryptionKey: isEncryptionKey ? password : undefined,
          password: isEncryptionKey ? undefined : password
        });
        resolved = true;
        return true;
      },
      check: {
        info: "Use encryption key",
        type: "transparent"
      }
    });
  });
};

const restoreBackup = async (options: {
  uri: string;
  deleteFile?: boolean;
  updateProgress: (progress?: string) => void;
}) => {
  try {
    const isLegacyBackup = options.uri.endsWith(".nnbackup");

    options.updateProgress("Preparing to restore backup file...");

    let filePath = options.uri;
    if (!isLegacyBackup) {
      if (Platform.OS === "android") {
        options.updateProgress(`Copying backup file to cache...`);
        const cacheFile = `file://${RNFetchBlob.fs.dirs.CacheDir}/backup.zip`;
        if (await RNFetchBlob.fs.exists(cacheFile)) {
          await RNFetchBlob.fs.unlink(cacheFile);
        }
        await RNFetchBlob.fs.createFile(cacheFile, "", "utf8");
        await RNFetchBlob.fs.cp(filePath, cacheFile);
        filePath = cacheFile;
      }

      const zipOutputFolder = `${cacheDir}/backup_extracted`;
      if (await RNFetchBlob.fs.exists(zipOutputFolder)) {
        await RNFetchBlob.fs.unlink(zipOutputFolder);
        await RNFetchBlob.fs.mkdir(zipOutputFolder);
      }
      options.updateProgress(`Extracting files from backup...`);
      await unzip(filePath, zipOutputFolder);

      const extractedBackupFiles = await RNFetchBlob.fs.ls(zipOutputFolder);
      const extractedAttachments = await RNFetchBlob.fs.ls(
        `${zipOutputFolder}/attachments`
      );

      const attachmentsKeyPath: any = extractedAttachments?.find(
        (path) => path === ".attachments_key"
      );
      const attachmentsKey = await JSON.parse(
        await RNFetchBlob.fs.readFile(
          `${zipOutputFolder}/attachments/${attachmentsKeyPath}`,
          "utf8"
        )
      );

      let count = 0;
      await db.transaction(async () => {
        let passwordOrKey: PasswordOrKey;
        for (const path of extractedBackupFiles) {
          if (path === ".nnbackup" || path === "attachments") continue;

          options.updateProgress(
            `Restoring data (${count++}/${extractedBackupFiles.length})`
          );

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
            options.updateProgress(undefined);
            throw new Error("Failed to decrypt backup");
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
        options.updateProgress(
          `Restoring attachments (${count++}/${extractedAttachments.length})`
        );
        const hash = path;
        const attachment = await db.attachments.attachment(hash as string);
        if (!attachment) continue;

        if (attachment.dateUploaded) {
          const key = await db.attachments.decryptKey(attachment.key);
          if (!key) continue;

          const calculatedHash = await Sodium.hashFile({
            uri: path,
            type: "cache"
          });
          if (calculatedHash !== attachment.hash) continue;
          await db.attachments.reset(attachment.id);
        }

        await deleteCacheFileByName(hash);
        const copied = await RNFetchBlob.fs.cp(
          `${zipOutputFolder}/attachments/${hash}`,
          `${cacheDir}/${hash}`
        );
      }

      options.updateProgress(`Cleaning up...`);

      // Remove files from cache
      RNFetchBlob.fs.unlink(zipOutputFolder).catch(console.log);
      if (Platform.OS === "android" || options.deleteFile) {
        RNFetchBlob.fs.unlink(filePath).catch(console.log);
      }
    } else {
      options.updateProgress(`Reading backup file...`);
      const rawData =
        Platform.OS === "android"
          ? await ScopedStorage.readFile(filePath, "utf8")
          : await RNFetchBlob.fs.readFile(filePath, "utf8");
      const backup: LegacyBackupFile = JSON.parse(rawData) as LegacyBackupFile;

      const isEncryptedBackup =
        typeof backup.data !== "string" && backup.data.cipher;

      options.updateProgress(
        isEncryptedBackup
          ? `Backup is encrypted, decrypting...`
          : "Preparing to restore backup file..."
      );

      const { encryptionKey, password } = isEncryptedBackup
        ? ({} as PasswordOrKey)
        : await withPassword();

      if (isEncryptedBackup && !encryptionKey && !password) {
        options.updateProgress(undefined);
        throw new Error("Failed to decrypt backup");
      }

      await db.transaction(async () => {
        options.updateProgress("Restoring backup...");
        await db.backup.import(backup, {
          encryptionKey,
          password
        });
      });
      options.updateProgress(undefined);

      ToastManager.show({
        heading: "Backup restored successfully"
      });
    }

    await db.initCollections();
    refreshAllStores();
    Navigation.queueRoutesForUpdate();
    options.updateProgress(undefined);
  } catch (e) {
    options.updateProgress(undefined);
    DatabaseLogger.error(e as Error);
    ToastManager.error(e as Error, `Failed to restore backup`);
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

  const [progress, setProgress] = useState<string>();

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
        const path = await storage.checkAndCreateDir("/backups/");
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
    }) => <BackupItem item={item} index={index} updateProgress={setProgress} />,
    []
  );

  return (
    <>
      <View>
        {progress ? (
          <BaseDialog visible>
            <DialogContainer
              style={{
                paddingHorizontal: 12,
                paddingBottom: 10
              }}
            >
              <Dialog context="local" />
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 50,
                  gap: 10,
                  paddingBottom: 20
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    width: 100,
                    paddingTop: 20
                  }}
                >
                  <ProgressBarComponent
                    height={5}
                    width={100}
                    animated={true}
                    useNativeDriver
                    indeterminate
                    indeterminateAnimationDuration={2000}
                    unfilledColor={colors.secondary.background}
                    color={colors.primary.accent}
                    borderWidth={0}
                  />
                </View>

                <Heading color={colors.primary.paragraph} size={SIZE.lg}>
                  Creating backup
                </Heading>
                <Paragraph
                  style={{
                    textAlign: "center"
                  }}
                  color={colors.secondary.paragraph}
                >
                  {progress ? progress : "Please wait while we create backup"}
                </Paragraph>

                <Button
                  title="Cancel"
                  type="secondaryAccented"
                  onPress={() => {
                    setProgress(undefined);
                  }}
                  width="100%"
                />
              </View>
            </DialogContainer>
          </BaseDialog>
        ) : null}

        <SectionItem
          item={{
            id: "restore-from-files",
            name: "Restore from files",
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

              console.log(file);

              restoreBackup({
                uri:
                  Platform.OS === "android"
                    ? (("file://" + file.fileCopyUri) as string)
                    : (file.fileCopyUri as string),
                deleteFile: true,
                updateProgress: setProgress
              });
            },
            description: "Restore a backup from files"
          }}
        />

        <SectionItem
          item={{
            id: "select-backup-folder",
            name: "Select folder with backup files",
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
            },
            description:
              "Select folder where backup files are stored to view and restore them from the app"
          }}
        />

        <FlatList
          ListHeaderComponent={
            <View
              style={{
                backgroundColor: colors.primary.background,
                marginBottom: 10
              }}
            >
              <Heading color={colors.primary.accent} size={SIZE.xs}>
                RECENT BACKUPS
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
                  No backups were found.{" "}
                  {!backupDirectoryAndroid
                    ? `Please select a folder with backup files to view them here.`
                    : null}
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
    </>
  );
};

const BackupItem = ({
  item,
  index,
  updateProgress
}: {
  item: ReactNativeBlobUtilStat | ScopedStorage.FileType;
  index: number;
  updateProgress: (progress?: string) => void;
}) => {
  const { colors } = useThemeColors();

  const isLegacyBackup =
    item.path?.endsWith(".nnbackup") ||
    (item as ScopedStorage.FileType).uri?.endsWith(".nnbackup");

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
        <Paragraph size={SIZE.sm}>
          {(
            (item as ReactNativeBlobUtilStat).filename ||
            (item as ScopedStorage.FileType).name
          )
            .replace(".nnbackupz", "")
            .replace(".nnbackup", "")}
        </Paragraph>
        <Paragraph
          size={SIZE.xs}
          color={colors.secondary.paragraph}
          style={{ width: "100%", maxWidth: "100%" }}
        >
          Created on {getFormattedDate(item?.lastModified, "date-time")}
          {isLegacyBackup ? "(Legacy backup)" : ""}
        </Paragraph>
      </View>
      <Button
        title="Restore"
        type="secondaryAccented"
        style={{
          paddingHorizontal: 12,
          height: 35
        }}
        onPress={() =>
          restoreBackup({
            uri:
              Platform.OS === "android"
                ? (item as ScopedStorage.FileType).uri
                : item.path,
            updateProgress: updateProgress
          })
        }
      />
    </View>
  );
};
