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

import { createBackup, verifyAccount, importBackup } from "../../common";
import { db } from "../../common/db";
import { exportNotes } from "../../common/export";
import { SettingsGroup } from "./types";
import { strings } from "@notesnook/intl";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { desktop } from "../../common/desktop-bridge";
import { PATHS } from "@notesnook/desktop";

const getDesktopBackupsDirectoryPath = () =>
  useSettingStore.getState().backupStorageLocation || PATHS.backupsDirectory;

export const BackupExportSettings: SettingsGroup[] = [
  {
    key: "backup",
    section: "backup-export",
    header: strings.backups(),
    settings: [
      {
        key: "create-backup",
        title: strings.backupNow(),
        description: strings.backupNowDesc(),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "-", title: strings.chooseBackupFormat() },
              { value: "partial", title: strings.backup() },
              { value: "full", title: strings.backupWithAttachments() }
            ],
            selectedOption: () => "-",
            onSelectionChanged: async (value) => {
              if (value === "-") return;
              await createBackup({
                mode: value === "partial" ? "partial" : "full"
              });
            }
          }
        ]
      },
      {
        key: "restore-backup",
        title: strings.restoreBackup(),
        description: strings.restoreBackupDesc(),
        components: [
          {
            type: "button",
            title: "Restore",
            action: async () => {
              if (await importBackup()) {
                await useAppStore.getState().refresh();
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "auto-backup",
        title: strings.automaticBackups(),
        description: strings.automaticBackupsDesc(),
        // isHidden: () => !isUserPremium(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.backupReminderOffset, listener),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "0", title: strings.never(), premium: true },
              { value: "1", title: strings.daily(), premium: true },
              { value: "2", title: strings.weekly(), premium: true },
              { value: "3", title: strings.monthly(), premium: true }
            ],
            selectedOption: () =>
              useSettingStore.getState().backupReminderOffset.toString(),
            onSelectionChanged: async (value) => {
              const verified =
                useSettingStore.getState().encryptBackups ||
                (await verifyAccount());
              if (verified)
                useSettingStore
                  .getState()
                  .setBackupReminderOffset(parseInt(value));
            }
          }
        ]
      },
      {
        key: "auto-backup-with-attachments",
        title: strings.automaticBackupsWithAttachments(),
        description: strings.automaticBackupsWithAttachmentsDesc().join("\n\n"),
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.fullBackupReminderOffset,
            listener
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "0", title: strings.never(), premium: true },
              { value: "1", title: strings.weekly(), premium: true },
              { value: "2", title: strings.monthly(), premium: true }
            ],
            selectedOption: () =>
              useSettingStore.getState().fullBackupReminderOffset.toString(),
            onSelectionChanged: async (value) => {
              const verified =
                useSettingStore.getState().encryptBackups ||
                (await verifyAccount());
              if (verified)
                useSettingStore
                  .getState()
                  .setFullBackupReminderOffset(parseInt(value));
            }
          }
        ]
      },
      {
        key: "encrypt-backups",
        title: strings.backupEncryption(),
        description: strings.backupEncryptionDesc(),
        isHidden: () => !useUserStore.getState().isLoggedIn,
        onStateChange: (listener) => {
          const subscriptions = [
            useUserStore.subscribe((s) => s.isLoggedIn, listener),
            useSettingStore.subscribe((s) => s.encryptBackups, listener)
          ];
          return () => subscriptions.forEach((s) => s());
        },
        components: [
          {
            type: "toggle",
            isToggled: () =>
              !!useUserStore.getState().isLoggedIn &&
              useSettingStore.getState().encryptBackups,
            toggle: async () => {
              const verified =
                !useSettingStore.getState().encryptBackups ||
                (await verifyAccount());
              if (verified) useSettingStore.getState().toggleEncryptBackups();
            }
          }
        ]
      },
      {
        key: "backup-directory",
        title: strings.selectBackupDir(),
        description: () =>
          strings
            .selectBackupDirDesc(getDesktopBackupsDirectoryPath())
            .join("\n\n"),
        isHidden: () => !IS_DESKTOP_APP,
        components: [
          {
            type: "button",
            title: strings.select(),
            action: async () => {
              const verified =
                useSettingStore.getState().encryptBackups ||
                (await verifyAccount());
              if (!verified) return;

              const backupStorageLocation = getDesktopBackupsDirectoryPath();
              const location = await desktop?.integration.selectDirectory.query(
                {
                  title: strings.selectBackupDir(),
                  defaultPath: backupStorageLocation
                }
              );
              if (!location) return;
              useSettingStore.getState().setBackupStorageLocation(location);
            },
            variant: "secondary"
          }
        ]
      }
    ]
  },
  {
    key: "export",
    section: "backup-export",
    header: strings.export(),
    settings: [
      {
        key: "export-notes",
        title: strings.exportAllNotes(),
        description: strings.exportAllNotesDesc(),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "-", title: strings.exportAs() },
              { value: "txt", title: "Text" },
              { value: "md", title: "Markdown", premium: true },
              {
                value: "md-frontmatter",
                title: "Markdown + Frontmatter",
                premium: true
              },
              { value: "html", title: "HTML", premium: true }
            ],
            selectedOption: () => "-",
            onSelectionChanged: async (value) => {
              if (!db.notes || value === "-") return;
              if (await verifyAccount())
                await exportNotes(
                  value as "txt" | "md" | "html" | "md-frontmatter",
                  db.notes.all
                );
            }
          }
        ]
      }
    ]
  }
];
