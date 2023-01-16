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

import { EVENTS } from "@notesnook/core/common";
import React, { createRef, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { FlatList } from "react-native-gesture-handler";
import * as ScopedStorage from "react-native-scoped-storage";
import { db } from "../../../common/database";
import storage from "../../../common/database/storage";
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { initialize } from "../../../stores";
import { useThemeStore } from "../../../stores/use-theme-store";
import { eCloseRestoreDialog, eOpenRestoreDialog } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { sleep, timeConverter } from "../../../utils/time";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { presentDialog } from "../../dialog/functions";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import SheetWrapper from "../../ui/sheet";
import Paragraph from "../../ui/typography/paragraph";
const actionSheetRef = createRef();
let RNFetchBlob;
const RestoreDataSheet = () => {
  const [visible, setVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    eSubscribeEvent(eOpenRestoreDialog, open);
    eSubscribeEvent(eCloseRestoreDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenRestoreDialog, open);
      eUnSubscribeEvent(eCloseRestoreDialog, close);
    };
  }, [close]);

  const open = async () => {
    setVisible(true);
    await sleep(30);
    actionSheetRef.current?.setModalVisible(true);
  };

  const close = useCallback(() => {
    if (restoring) {
      showIsWorking();
      return;
    }
    actionSheetRef.current?.setModalVisible(false);
    setTimeout(() => {
      setVisible(false);
    }, 300);
  }, [restoring]);

  const showIsWorking = () => {
    ToastEvent.show({
      heading: "Restoring Backup",
      message: "Your backup data is being restored. please wait.",
      type: "error",
      context: "local"
    });
  };

  return !visible ? null : (
    <SheetWrapper
      fwdRef={actionSheetRef}
      gestureEnabled={!restoring}
      closeOnTouchBackdrop={!restoring}
      onClose={close}
    >
      <RestoreDataComponent
        close={close}
        restoring={restoring}
        setRestoring={setRestoring}
      />
      <Toast context="local" />
    </SheetWrapper>
  );
};

export default RestoreDataSheet;

const RestoreDataComponent = ({ close, setRestoring, restoring }) => {
  const colors = useThemeStore((state) => state.colors);
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
    checkBackups();
  }, []);

  const restore = async (item) => {
    if (restoring) {
      return;
    }
    try {
      setRestoring(true);
      let prefix = Platform.OS === "ios" ? "" : "file:/";
      let backup;
      if (Platform.OS === "android") {
        backup = await ScopedStorage.readFile(item.uri, "utf8");
      } else {
        backup = await RNFetchBlob.fs.readFile(prefix + item.path, "utf8");
      }
      backup = JSON.parse(backup);

      if (backup.data.iv && backup.data.salt) {
        withPassword(
          async (value) => {
            try {
              await restoreBackup(backup, value);
              close();
              setRestoring(false);
              return true;
            } catch (e) {
              backupError(e);
              return false;
            }
          },
          () => {
            setRestoring(false);
          }
        );
      } else {
        await restoreBackup(backup);
        close();
      }
    } catch (e) {
      setRestoring(false);
      backupError(e);
    }
  };

  const withPassword = (onsubmit, onclose = () => {}) => {
    presentDialog({
      context: "local",
      title: "Encrypted backup",
      input: true,
      inputPlaceholder: "Password",
      paragraph: "Please enter password of this backup file to restore it",
      positiveText: "Restore",
      secureTextEntry: true,
      onClose: onclose,
      negativeText: "Cancel",
      positivePress: async (password) => {
        try {
          return await onsubmit(password);
        } catch (e) {
          ToastEvent.show({
            heading: "Failed to backup data",
            message: e.message,
            type: "error",
            context: "global"
          });
          return false;
        }
      }
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
        RNFetchBlob = (await import("rn-fetch-blob")).default;
        let path = await storage.checkAndCreateDir("/backups/");
        files = await RNFetchBlob.fs.lstat(path);
      }
      files = files.sort(function (a, b) {
        let timeA = a.lastModified;
        let timeB = b.lastModified;
        return timeB - timeA;
      });
      setFiles(files);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (e) {
      console.log(e);
      setLoading(false);
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
        borderBottomColor: colors.nav
      }}
    >
      <View
        style={{
          maxWidth: "75%"
        }}
      >
        <Paragraph size={SIZE.sm} style={{ width: "100%", maxWidth: "100%" }}>
          {timeConverter(item?.lastModified * 1)}
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

  const restoreBackup = async (backup, password) => {
    await db.backup.import(backup, password);
    setRestoring(false);
    initialize();
    ToastEvent.show({
      heading: "Backup restored successfully.",
      type: "success",
      context: "global"
    });
  };

  const backupError = (e) => {
    ToastEvent.show({
      heading: "Restore failed",
      message:
        e.message ||
        "The selected backup data file is invalid. You must select a *.nnbackup file to restore.",
      type: "error",
      context: "local"
    });
  };

  const button = {
    title: "Restore from files",
    onPress: () => {
      if (restoring) {
        return;
      }

      DocumentPicker.pickSingle()
        .then((r) => {
          setRestoring(true);
          fetch(r.uri)
            .then(async (r) => {
              try {
                let backup = await r.json();
                if (backup.data.iv && backup.data.salt) {
                  withPassword(
                    async (value) => {
                      try {
                        restoreBackup(backup, value).then(() => {
                          close();
                          setRestoring(false);
                        });
                        return true;
                      } catch (e) {
                        backupError(e);
                        setRestoring(false);
                        return false;
                      }
                    },
                    () => {
                      setRestoring(false);
                    }
                  );
                } else {
                  await restoreBackup(backup);
                  close();
                }
              } catch (e) {
                setRestoring(false);
                backupError(e);
              }
            })
            .catch(console.log);
        })
        .catch(console.log);
    }
  };

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
          nestedScrollEnabled
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
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
                  <ActivityIndicator color={colors.accent} size={SIZE.lg} />
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
                        color={colors.icon}
                      >
                        Select the folder that includes your backup files to
                        list them here.
                      </Paragraph>
                    </>
                  ) : (
                    <Paragraph color={colors.icon}>No backups found</Paragraph>
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
                <ActivityIndicator color={colors.accent} />
                <Paragraph color={colors.icon}>
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
