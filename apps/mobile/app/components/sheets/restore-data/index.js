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

import { getFormattedDate } from "@notesnook/common";
import { EVENTS } from "@notesnook/core/dist/common";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import RNFetchBlob from "react-native-blob-util";
import DocumentPicker from "react-native-document-picker";
import * as ScopedStorage from "react-native-scoped-storage";
import { unzip } from "react-native-zip-archive";
import { db } from "../../../common/database";
import storage from "../../../common/database/storage";
import { cacheDir, copyFileAsync } from "../../../common/filesystem/utils";
import {
  ToastManager,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { initialize } from "../../../stores";
import { eCloseRestoreDialog, eOpenRestoreDialog } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { presentDialog } from "../../dialog/functions";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import SheetWrapper from "../../ui/sheet";
import Paragraph from "../../ui/typography/paragraph";
import Navigation from "../../../services/navigation";

const RestoreDataSheet = () => {
  const [visible, setVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const sheet = useRef();
  useEffect(() => {
    const open = async () => {
      setVisible(true);
      setTimeout(() => {
        sheet.current?.show();
      }, 1);
    };
    eSubscribeEvent(eOpenRestoreDialog, open);
    eSubscribeEvent(eCloseRestoreDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenRestoreDialog, open);
      eUnSubscribeEvent(eCloseRestoreDialog, close);
    };
  }, [close]);

  const close = useCallback(() => {
    if (restoring) {
      showIsWorking();
      return;
    }
    sheet.current?.hide();
    setTimeout(() => {
      setVisible(false);
    }, 150);
  }, [restoring]);

  const showIsWorking = () => {
    ToastManager.show({
      heading: "Restoring Backup",
      message: "Your backup data is being restored. please wait.",
      type: "error",
      context: "local"
    });
  };

  return !visible ? null : (
    <SheetWrapper
      fwdRef={sheet}
      gestureEnabled={!restoring}
      closeOnTouchBackdrop={!restoring}
      onClose={() => {
        setVisible(false);
        close();
      }}
    >
      <RestoreDataComponent
        close={close}
        restoring={restoring}
        setRestoring={setRestoring}
        actionSheetRef={sheet}
      />
      <Toast context="local" />
    </SheetWrapper>
  );
};

export default RestoreDataSheet;

const RestoreDataComponent = ({ close, setRestoring, restoring }) => {
  const { colors } = useThemeColors();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupDirectoryAndroid, setBackupDirectoryAndroid] = useState(false);
  const [progress, setProgress] = useState();
  useEffect(() => {
    const subscription = db.eventManager.subscribe(
      EVENTS.migrationProgress,
      (progress) => {
        setProgress(progress);
      }
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      checkBackups();
    }, 1000);
  }, []);

  const restore = async (item) => {
    if (restoring) {
      return;
    }

    try {
      const file = Platform.OS === "ios" ? item.path : item.uri;
      console.log(file);
      if (file.endsWith(".nnbackupz")) {
        setRestoring(true);

        if (Platform.OS === "android") {
          const cacheFile = `file://${RNFetchBlob.fs.dirs.CacheDir}/backup.zip`;
          if (await RNFetchBlob.fs.exists(cacheFile)) {
            await RNFetchBlob.fs.unlink(cacheFile);
          }
          await RNFetchBlob.fs.createFile(cacheFile, "", "utf8");
          console.log("copying");
          await copyFileAsync(file, cacheFile);
          console.log("copied");
          await restoreFromZip(cacheFile);
        } else {
          await restoreFromZip(file, false);
        }
      } else if (file.endsWith(".nnbackup")) {
        let backup;
        if (Platform.OS === "android") {
          backup = await ScopedStorage.readFile(file, "utf8");
        } else {
          backup = await RNFetchBlob.fs.readFile(file, "utf8");
        }
        await restoreFromNNBackup(JSON.parse(backup));
      }
    } catch (e) {
      console.log("error", e);
      setRestoring(false);
      backupError(e);
    }
  };

  const withPassword = () => {
    return new Promise((resolve) => {
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
          resolve(undefined);
        },
        negativeText: "Cancel",
        positivePress: async (password, isEncryptionKey) => {
          resolve({
            value: password,
            isEncryptionKey
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

  const checkBackups = async () => {
    try {
      let files = [];
      if (Platform.OS === "android") {
        let backupDirectory = SettingsService.get().backupDirectoryAndroid;
        if (backupDirectory) {
          setBackupDirectoryAndroid(backupDirectory);
          files = await ScopedStorage.listFiles(backupDirectory.uri);
        } else {
          setLoading(false);
          return;
        }
      } else {
        let path = await storage.checkAndCreateDir("/backups/");
        files = await RNFetchBlob.fs.lstat(path);
      }
      files = files
        .filter((file) => {
          const name = Platform.OS === "android" ? file.name : file.filename;
          return name.endsWith(".nnbackup") || name.endsWith(".nnbackupz");
        })
        .sort(function (a, b) {
          let timeA = a.lastModified;
          let timeB = b.lastModified;
          return timeB - timeA;
        });
      setFiles(files);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const restoreBackup = async (backup, password, key) => {
    await db.backup.import(backup, password, key);

    await db.initCollections();
    initialize();
    ToastManager.show({
      heading: "Backup restored successfully.",
      type: "success",
      context: "global"
    });
    Navigation.queueRoutesForUpdate();
    return true;
  };

  const backupError = (e) => {
    console.log(e.stack);
    ToastManager.show({
      heading: "Restore failed",
      message:
        e.message ||
        "The selected backup data file is invalid. You must select a *.nnbackup file to restore.",
      type: "error",
      context: "local"
    });
  };

  /**
   *
   * @param {string} file
   */
  async function restoreFromZip(file, remove) {
    try {
      const zipOutputFolder = `${cacheDir}/backup_extracted`;
      if (await RNFetchBlob.fs.exists(zipOutputFolder)) {
        await RNFetchBlob.fs.unlink(zipOutputFolder);
        await RNFetchBlob.fs.mkdir(zipOutputFolder);
      }
      await unzip(file, zipOutputFolder);
      console.log("Unzipped files successfully to", zipOutputFolder);

      const backupFiles = await RNFetchBlob.fs.ls(zipOutputFolder);

      if (backupFiles.findIndex((file) => file === ".nnbackup") === -1) {
        throw new Error("Backup file is invalid");
      }

      let password;
      let key;

      console.log(`Found ${backupFiles?.length} files to restore from backup`);
      for (const path of backupFiles) {
        if (path === ".nnbackup") continue;
        const filePath = `${zipOutputFolder}/${path}`;
        const data = await RNFetchBlob.fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(data);

        if (parsed.encrypted && !password) {
          console.log("Backup is encrypted...", "requesting password");
          const { value, isEncryptionKey } = await withPassword();

          if (isEncryptionKey) {
            key = value;
          } else {
            password = value;
          }
          if (!password && !key) throw new Error("Failed to decrypt backup");
        }
        await db.backup.import(parsed, password, key);
        console.log("Imported", path);
      }
      // Remove files from cache
      RNFetchBlob.fs.unlink(zipOutputFolder).catch(console.log);
      if (remove) {
        RNFetchBlob.fs.unlink(file).catch(console.log);
      }

      await db.initCollections();
      Navigation.queueRoutesForUpdate();
      setRestoring(false);
      close();
      ToastManager.show({
        heading: "Backup restored successfully.",
        type: "success",
        context: "global"
      });
    } catch (e) {
      backupError(e);
      setRestoring(false);
    }
  }

  /**
   *
   * @param {string} file
   */
  async function restoreFromNNBackup(backup) {
    try {
      if (backup.data.iv && backup.data.salt) {
        const { value, isEncryptionKey } = await withPassword();

        let key;
        let password;
        if (isEncryptionKey) {
          key = value;
        } else {
          password = value;
        }

        if (key || password) {
          try {
            await restoreBackup(backup, password, key);
            close();
            setRestoring(false);
          } catch (e) {
            setRestoring(false);
            backupError(e);
          }
        } else {
          setRestoring(false);
        }
      } else {
        await restoreBackup(backup);
        setRestoring(false);
        close();
      }
    } catch (e) {
      setRestoring(false);
      backupError(e);
    }
  }

  const button = {
    title: "Restore from files",
    onPress: async () => {
      if (restoring) {
        return;
      }
      try {
        const file = await DocumentPicker.pickSingle({
          copyTo: "cachesDirectory"
        });

        if (file.name.endsWith(".nnbackupz")) {
          setRestoring(true);
          await restoreFromZip(file.fileCopyUri, true);
        } else if (file.name.endsWith(".nnbackup")) {
          RNFetchBlob.fs.unlink(file.fileCopyUri).catch(console.log);
          setRestoring(true);
          const data = await fetch(file.uri);
          await restoreFromNNBackup(await data.json());
        }
      } catch (e) {
        console.log("error", e.stack);
        setRestoring(false);
        backupError(e);
      }
    }
  };

  const renderItem = ({ item, index }) => (
    <View
      style={{
        minHeight: 50,
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        borderRadius: 0,
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: colors.secondary.background
      }}
    >
      <View
        style={{
          maxWidth: "75%"
        }}
      >
        <Paragraph size={SIZE.sm} style={{ width: "100%", maxWidth: "100%" }}>
          {getFormattedDate(item?.lastModified * 1)}
        </Paragraph>
        <Paragraph size={SIZE.xs}>
          {(item.filename || item.name).replace(".nnbackup", "")}
        </Paragraph>
      </View>
      <Button
        title="Restore"
        height={30}
        type="accent"
        style={{
          borderRadius: 100,
          paddingHorizontal: 12
        }}
        fontSize={SIZE.sm - 1}
        onPress={() => restore(item, index)}
      />
    </View>
  );

  return (
    <>
      <View>
        <Dialog context="local" />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            paddingRight: 8,
            alignItems: "center",
            paddingTop: restoring ? 8 : 0
          }}
        >
          <DialogHeader
            title="Backups"
            paragraph={`All the backups are stored in ${
              Platform.OS === "ios"
                ? "File Manager/Notesnook/Backups"
                : "selected backups folder."
            }`}
            button={button}
          />
        </View>
        <Seperator half />
        <FlatList
          ListEmptyComponent={
            !restoring ? (
              loading ? (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    height: 100
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
                    height: 100
                  }}
                >
                  {Platform.OS === "android" && !backupDirectoryAndroid ? (
                    <>
                      <Button
                        title="Select backups folder"
                        icon="folder"
                        onPress={async () => {
                          let folder = await ScopedStorage.openDocumentTree(
                            true
                          );
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
                        }}
                        style={{
                          marginTop: 10,
                          paddingHorizontal: 12
                        }}
                        height={30}
                        width={null}
                      />

                      <Paragraph
                        style={{
                          textAlign: "center",
                          marginTop: 5
                        }}
                        size={SIZE.xs}
                        textBreakStrategy="balanced"
                        color={colors.secondary.paragraph}
                      >
                        Select the folder that includes your backup files to
                        list them here.
                      </Paragraph>
                    </>
                  ) : (
                    <Paragraph color={colors.secondary.paragraph}>
                      No backups found
                    </Paragraph>
                  )}
                </View>
              )
            ) : (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200
                }}
              >
                <ActivityIndicator color={colors.primary.accent} />
                <Paragraph color={colors.secondary.paragraph}>
                  Restoring {progress ? progress?.collection : null}
                  {progress ? `(${progress.current}/${progress.total}) ` : null}
                  ...Please wait.
                </Paragraph>
              </View>
            )
          }
          keyExtractor={(item) => item.name || item.filename}
          style={{
            paddingHorizontal: 12
          }}
          data={restoring || loading ? [] : files}
          renderItem={renderItem}
          ListFooterComponent={
            restoring || loading || files.length === 0 ? null : (
              <View
                style={{
                  height: 200
                }}
              />
            )
          }
        />
      </View>
    </>
  );
};
