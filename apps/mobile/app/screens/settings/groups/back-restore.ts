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
          id: "backup-now",
          name: strings.backupNow(),
          description: strings.backupNowDesc(),
          modifer: async () => {
            const user = useUserStore.getState().user;
            if (!user || SettingsService.getProperty("encryptedBackup")) {
              await BackupService.run(true);
              return;
            }

            verifyUser(null, () => BackupService.run(true));
          }
        },
        {
          id: "backup-now-with-attachments",
          name: strings.backupNowWithAttachments(),
          description: strings.backupNowWithAttachmentsDesc(),
          hidden: () => !useUserStore.getState().user,
          modifer: async () => {
            const user = useUserStore.getState().user;
            if (!user || SettingsService.getProperty("encryptedBackup")) {
              await BackupService.run(true, undefined, "full");
              return;
            }

            verifyUser(null, () => BackupService.run(true, undefined, "full"));
          }
        },
        {
          id: "auto-backups",
          type: "component",
          name: strings.automaticBackups(),
          description: strings.automaticBackupsDesc(),
          component: "autobackups"
        },
        {
          id: "auto-backups-with-attachments",
          type: "component",
          hidden: () => !useUserStore.getState().user,
          name: strings.automaticBackupsWithAttachments(),
          description: [...strings.automaticBackupsWithAttachmentsDesc()].join(
            "\n"
          ),
          component: "autobackupsattachments"
        },
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
        },
        {
          id: "enable-backup-encryption",
          type: "switch",
          name: strings.backupEncryption(),
          description: strings.backupEncryptionDesc(),
          icon: "lock",
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
              await verifyUser(null, () => {
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
    },
    {
      id: "restore-backup",
      name: strings.restoreBackup(),
      description: strings.restoreBackupDesc(),
      icon: "arrow-counter-clockwise",
      iconFamily: "notesnook",
      type: "screen",
      component: "backuprestore"
    },
    {
      id: "export-notes",
      name: strings.exportAllNotes(),
      icon: "export",
      iconFamily: "notesnook",
      description: strings.exportAllNotesDesc(),
      modifer: () => {
        verifyUser(null, () => {
          ExportNotesSheet.present(undefined, true);
        });
      }
    }
  ]
};
