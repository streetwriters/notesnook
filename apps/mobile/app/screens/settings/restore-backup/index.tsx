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

import { LegendList } from "@legendapp/list";
import { formatBytes, getFormattedDate } from "@notesnook/common";
import { LegacyBackupFile } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import RNFetchBlob, { ReactNativeBlobUtilStat } from "react-native-blob-util";
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
import {
  createFormRef,
  validators
} from "../../../components/ui/input/form-input";
import Paragraph from "../../../components/ui/typography/paragraph";
import { ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { refreshAllStores } from "../../../stores/create-db-collection-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import Heading from "../../../components/ui/typography/heading";
import { Spacing } from "../../../common/design/spacing";

type PasswordOrKey = { password?: string; encryptionKey?: string };

const RESTORE_CANCELLED = new Error("restore-cancelled");

const getPasswordError = (e: unknown): string | undefined => {
  const message = e instanceof Error ? e.message : "";
  if (message === "Incorrect password.") return strings.passwordIncorrect();
  if (message === "Invalid encryption key.")
    return strings.invalid(strings.encryptionKey());
  return undefined;
};

const verifyWithImport =
  (importBackup: (passwordOrKey: PasswordOrKey) => Promise<unknown>) =>
  async (passwordOrKey: PasswordOrKey): Promise<string | undefined> => {
    try {
      await importBackup(passwordOrKey);
      return undefined;
    } catch (e) {
      const error = getPasswordError(e);
      if (error) return error;
      throw e;
    }
  };

const withPassword = (
  verify: (passwordOrKey: PasswordOrKey) => Promise<string | undefined>
) => {
  return new Promise<PasswordOrKey>((resolve, reject) => {
    const formRef = createFormRef({ password: "" });
    let done = false;
    presentDialog({
      context: "local",
      title: strings.backupEncrypted(),
      paragraph: strings.backupEnterPassword(),
      positiveText: strings.restore(),
      secureTextEntry: true,
      form: {
        formRef,
        items: [
          {
            name: "password",
            placeholder: strings.password(),
            ref: React.createRef(),
            validators: [validators.required(strings.passwordNotEntered())]
          }
        ],
        onFormSubmit: async (form, isEncryptionKey) => {
          if (!form.validate()) return false;
          const value = form.getValue("password");
          const passwordOrKey: PasswordOrKey = {
            encryptionKey: isEncryptionKey ? value : undefined,
            password: isEncryptionKey ? undefined : value
          };
          try {
            const error = await verify(passwordOrKey);
            if (error) {
              form.setError("password", error);
              return false;
            }
          } catch (e) {
            done = true;
            reject(e);
            return true;
          }
          done = true;
          resolve(passwordOrKey);
          return true;
        }
      },
      onClose: () => {
        if (done) return;
        resolve({});
      },
      negativeText: strings.cancel(),
      check: {
        info: strings.useEncryptionKey(),
        type: "transparent"
      }
    });
  });
};

export const restoreBackup = async (options: {
  uri: string;
  deleteFile?: boolean;
}) => {
  try {
    if (
      !options.uri.endsWith(".nnbackup") &&
      !options.uri.endsWith(".nnbackupz")
    ) {
      throw new Error(
        `Invalid backup file selected. Only .nnbackup and .nnbackupz files can be restored.`
      );
    }

    const isLegacyBackup = options.uri.endsWith(".nnbackup");

    startProgress({
      title: strings.restoring(),
      paragraph: strings.preparingBackupRestore(),
      icon: "arrows-clockwise",
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
        let passwordOrKey: PasswordOrKey | undefined = undefined;
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

          const importBackup = (passwordOrKey: PasswordOrKey) =>
            db.backup.import(backup, {
              ...passwordOrKey,
              attachmentsKey: attachmentsKey
            });

          if (!isEncryptedBackup) {
            await importBackup({});
            continue;
          }

          if (!passwordOrKey) {
            passwordOrKey = await withPassword(verifyWithImport(importBackup));
            if (!passwordOrKey.encryptionKey && !passwordOrKey.password) {
              throw RESTORE_CANCELLED;
            }
            continue;
          }

          await importBackup(passwordOrKey);
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
      RNFetchBlob.fs.unlink(zipOutputFolder).catch(() => {
        /* empty */
      });
      if (Platform.OS === "android" || deleteBackupFile) {
        RNFetchBlob.fs.unlink(filePath).catch(() => {
          /* empty */
        });
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

      await db.transaction(async () => {
        const importBackup = (passwordOrKey: PasswordOrKey) =>
          db.backup.import(backup, passwordOrKey);

        if (!isEncryptedBackup) {
          updateProgress({
            progress: strings.restoringBackup()
          });
          await importBackup({});
          return;
        }

        updateProgress({
          progress: strings.decryptingBackup()
        });
        // Prompt for the password and validate it by importing from inside the
        // dialog so an incorrect password keeps the dialog open.
        const passwordOrKey = await withPassword(
          verifyWithImport(importBackup)
        );
        if (!passwordOrKey.encryptionKey && !passwordOrKey.password) {
          throw RESTORE_CANCELLED;
        }
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
    // User dismissed the password prompt: abort silently without an error toast.
    if (e === RESTORE_CANCELLED) return;
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
  const backupDirectoryAndroid = useSettingStore(
    (state) => state.settings.backupDirectoryAndroid
  );

  useEffect(() => {
    setTimeout(() => {
      checkBackups();
    }, 1000);
  }, []);

  const checkBackups = async () => {
    try {
      let files: (ReactNativeBlobUtilStat | ScopedStorage.FileType)[] = [];
      if (Platform.OS === "android") {
        if (backupDirectoryAndroid) {
          files = await ScopedStorage.listFiles(backupDirectoryAndroid.uri);
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
      setLoading(false);
      BACKUP_FILES_CACHE.splice(0, BACKUP_FILES_CACHE.length, ...files);
      setLoading(false);
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
      <LegendList
        ListHeaderComponent={
          <Heading
            style={{
              marginBottom: Spacing.LEVEL_2
            }}
            color={colors.secondary.paragraph}
            size={AppFontSize.sm}
            fontFamily="MEDIUM"
          >
            {strings.recentBackups()}
          </Heading>
        }
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
                size={AppFontSize.lg}
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
        keyExtractor={(item) =>
          (item as ScopedStorage.FileType).name ||
          (item as ReactNativeBlobUtilStat).filename
        }
        ListFooterComponent={
          <View
            style={{
              height: 200
            }}
          />
        }
        style={{
          width: "100%"
        }}
        data={files}
        renderItem={renderItem}
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
        gap: DefaultAppStyles.GAP_SMALL,
        paddingVertical: Spacing.LEVEL_2,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary.separator
      }}
    >
      <View
        style={{
          flexShrink: 1,
          gap: Spacing.LEVEL_1
        }}
      >
        <Heading size={AppFontSize.md}>{itemName}</Heading>

        <Paragraph
          size={AppFontSize.xs}
          color={colors.secondary.paragraph}
          style={{ width: "100%", maxWidth: "100%" }}
        >
          Created: {getFormattedDate(item?.lastModified, "date-time")}
          {" • "}
          {formatBytes((item as ReactNativeBlobUtilStat).size)}
        </Paragraph>
      </View>
      <Button
        title="Restore"
        type="plain-outline"
        style={{
          paddingHorizontal: Spacing.LEVEL_2,
          paddingVertical: Spacing.LEVEL_1
        }}
        onPress={() => {
          presentDialog({
            title: `${strings.restore()} ${itemName}`,
            paragraph: strings.restoreBackupConfirm(),
            positiveText: strings.restore(),
            negativeText: strings.cancel(),
            context: "global",
            positivePress: async () => {
              setTimeout(() => {
                restoreBackup({
                  uri:
                    Platform.OS === "android"
                      ? (item as ScopedStorage.FileType).uri
                      : (item as ReactNativeBlobUtilStat).path
                });
              }, 500);
              return true;
            }
          });
        }}
      />
    </View>
  );
};
