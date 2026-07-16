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

import { strings } from "@notesnook/intl";
import { Platform } from "react-native";
import ExportNotesSheet from "../../../components/sheets/export-notes";
import BackupService from "../../../services/backup";
import SettingsService from "../../../services/settings";
import { useUserStore } from "../../../stores/use-user-store";
import { ToastManager } from "../../../services/event-manager";
import { verifyUser } from "../verify-user";
import { SettingSection } from "../types";
import { restoreBackup } from "../restore-backup";
import { keepLocalCopy, pick } from "@react-native-documents/picker";
import * as ScopedStorage from "react-native-scoped-storage";

export const backRestoreGroup: SettingSection = {
  id: "back-restore",
  name: strings.backupRestore(),
  sections: [
    {
      id: "backups",
      type: "screen",
      name: strings.backups(),
      icon: "clock-counter-clockwise",
      iconFamily: "notesnook",
      description: strings.backupsDesc(),
      sections: [
        {
          id: "backup-actions-group",
          type: "group",
          name: strings.backupActions(),
          sections: [
            {
              id: "backup-now",
              name: strings.backupNow(),
              description: strings.backupNowDesc(),
              icon: "clock-counter-clockwise",
              iconFamily: "notesnook",
              modifer: async () => {
                const user = useUserStore.getState().user;
                if (!user || SettingsService.getProperty("encryptedBackup")) {
                  await BackupService.run(true);
                  return;
                }

                verifyUser(undefined, () => BackupService.run(true));
              }
            },
            {
              id: "backup-now-with-attachments",
              name: strings.fullBackup(),
              description: strings.backupNowWithAttachmentsDesc(),
              icon: "cloud-check",
              iconFamily: "notesnook",
              hidden: () => !useUserStore.getState().user,
              modifer: async () => {
                const user = useUserStore.getState().user;
                if (!user || SettingsService.getProperty("encryptedBackup")) {
                  await BackupService.run(true, undefined, "full");
                  return;
                }

                verifyUser(undefined, () =>
                  BackupService.run(true, undefined, "full")
                );
              }
            }
          ]
        },
        {
          id: "auto-backups-group",
          name: strings.automaticBackups(),
          type: "group",
          sections: [
            {
              id: "auto-backups",
              type: "component",
              icon: "clock",
              iconFamily: "notesnook",
              name: strings.automaticBackups(),
              description: strings.automaticBackupsDesc(),
              component: "autobackups"
            },
            {
              id: "auto-backups-with-attachments",
              type: "component",
              icon: "arrows-clockwise",
              iconFamily: "notesnook",
              hidden: () => !useUserStore.getState().user,
              name: strings.automaticFullBackup(),
              description: [
                ...strings.automaticBackupsWithAttachmentsDesc()
              ].join("\n"),
              component: "autobackupsattachments"
            }
          ]
        },
        {
          id: "storage-location-group",
          name: strings.storageAndLocation(),
          type: "group",
          hidden: () => Platform.OS !== "android",
          sections: [
            {
              id: "select-backup-dir",
              name: strings.selectBackupDir(),
              description: () => {
                const desc = strings.selectBackupDirDesc(
                  SettingsService.get().backupDirectoryAndroid?.path || ""
                );
                return desc[0] + " " + desc[1];
              },
              icon: "folder",
              iconFamily: "notesnook",
              isModal: true,
              hidden: () =>
                !!SettingsService.get().backupDirectoryAndroid ||
                Platform.OS !== "android",
              property: "backupDirectoryAndroid",
              modifer: async () => {
                let dir;
                try {
                  dir = await BackupService.checkBackupDirExists(true);
                } catch (e) {
                  console.error(e);
                } finally {
                  if (!dir) {
                    ToastManager.show({
                      heading: strings.noDirectorySelected(),
                      type: "error"
                    });
                  }
                }
              }
            },
            {
              id: "change-backup-dir",
              name: strings.changeBackupDir(),
              isModal: true,
              description: () =>
                SettingsService.get().backupDirectoryAndroid?.name || "",
              icon: "folder",
              hidden: () =>
                !SettingsService.get().backupDirectoryAndroid ||
                Platform.OS !== "android",
              property: "backupDirectoryAndroid",
              modifer: async () => {
                let dir;
                try {
                  dir = await BackupService.checkBackupDirExists(true);
                } catch (e) {
                  console.error(e);
                } finally {
                  if (!dir) {
                    ToastManager.show({
                      heading: strings.noDirectorySelected(),
                      type: "error"
                    });
                  }
                }
              }
            }
          ]
        },
        {
          id: "backup-encryption-group",
          type: "group",
          name: strings.security(),
          sections: [
            {
              id: "enable-backup-encryption",
              type: "switch",
              name: strings.backupEncryption(),
              description: strings.backupEncryptionDesc(),
              icon: "folder-lock",
              iconFamily: "notesnook",
              property: "encryptedBackup",
              modifer: async () => {
                const user = useUserStore.getState().user;
                const settings = SettingsService.get();
                if (!user) {
                  ToastManager.show({
                    heading: strings.loginRequired(),
                    type: "error"
                  });
                  return;
                }
                if (settings.encryptedBackup) {
                  await verifyUser(undefined, () => {
                    SettingsService.set({
                      encryptedBackup: false
                    });
                  });
                } else {
                  SettingsService.set({
                    encryptedBackup: true
                  });
                }
              }
            }
          ]
        }
      ]
    },
    {
      id: "restore-backup",
      name: strings.restoreBackup(),
      description: strings.restoreBackupDesc(),
      icon: "arrow-counter-clockwise",
      iconFamily: "notesnook",
      type: "screen",
      sections: [
        {
          id: "restore-options",
          type: "group",
          name: strings.restoreActions(),
          sections: [
            {
              id: "restore-from-files",
              name: strings.restoreFromFiles(),
              icon: "folder",
              isModal: true,
              modifer: async () => {
                useUserStore.setState({
                  disableAppLockRequests: true
                });
                const file = await pick();
                const fileCopy = await keepLocalCopy({
                  destination: "cachesDirectory",
                  files: [
                    {
                      uri: file[0].uri,
                      fileName: file[0].name ?? `backup_restore_${Date.now()}`
                    }
                  ]
                });

                if (fileCopy[0].status === "error") {
                  ToastManager.error(new Error("File copy error"));
                  return;
                }

                setTimeout(() => {
                  useUserStore.setState({
                    disableAppLockRequests: false
                  });
                }, 1000);

                restoreBackup({
                  uri: fileCopy[0].localUri,
                  deleteFile: true
                });
              },
              description: strings.selectBackupFileDesc()
            },
            {
              id: "select-backup-folder",
              name: strings.selectBackupFolder(),
              icon: "folder",
              isModal: true,
              hidden: () => Platform.OS !== "android",
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
              },
              description: strings.selectFolderForBackupFilesDesc()
            }
          ]
        },
        {
          id: "recent-backups-group",
          type: "component",
          component: "backuprestore"
        }
      ]
    },
    {
      id: "export-notes",
      name: strings.exportAllNotes(),
      icon: "export",
      iconFamily: "notesnook",
      description: strings.exportAllNotesDesc(),
      isModal: true,
      modifer: () => {
        verifyUser(undefined, () => {
          ExportNotesSheet.present(undefined, true);
        });
      }
    }
  ]
};
