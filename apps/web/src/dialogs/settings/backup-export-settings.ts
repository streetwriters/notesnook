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

import { SettingsGroup } from "./types";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { createBackup, importBackup, verifyAccount } from "../../common";
import { db } from "../../common/db";
import { exportNotes } from "../../common/export";

import { desktop } from "../../common/desktop-bridge";
import { PATHS } from "@notesnook/desktop";

export const BackupExportSettings: SettingsGroup[] = [
  {
    key: "backup",
    section: "backup-export",
    header: "Backups",
    settings: [
      {
        key: "create-backup",
        title: "Create backup",
        description:
          "Partial backups contain all your data except attachments. They are created from data already available on your device and do not require an Internet connection.",
        components: [
          {
            type: "dropdown",
            options: [
              { value: "-", title: "Choose backup format" },
              { value: "partial", title: "Backup" },
              { value: "full", title: "Backup with attachments" }
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
        title: "Restore backup",
        description: "Restore a backup file from your disk drive.",
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
        title: "Automatic backups",
        description: `Set the interval to create a backup automatically.
        
Note: these backups do not contain attachments.`,
        isHidden: () => !isUserPremium(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.backupReminderOffset, listener),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "0", title: "Never" },
              { value: "1", title: "Daily" },
              { value: "2", title: "Weekly" },
              { value: "3", title: "Monthly" }
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
        title: "Automatic backup with attachments",
        description: `Set the interval to create a backup (with attachments) automatically.

NOTE: Creating a backup with attachments can take a while, and also fail completely. The app will try to resume/restart the backup in case of interruptions.`,
        isHidden: () => !isUserPremium(),
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => s.fullBackupReminderOffset,
            listener
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "0", title: "Never" },
              { value: "1", title: "Weekly" },
              { value: "2", title: "Monthly" }
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
        title: "Backup encryption",
        description: "Encrypt all backup files using your master key.",
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
        title: "Backups directory",
        description: "Select directory to store all backup files.",
        isHidden: () => !IS_DESKTOP_APP,
        components: [
          {
            type: "button",
            title: "Select directory",
            action: async () => {
              const verified =
                useSettingStore.getState().encryptBackups ||
                (await verifyAccount());
              if (!verified) return;

              const backupStorageLocation =
                useSettingStore.getState().backupStorageLocation ||
                PATHS.backupsDirectory;
              const location = await desktop?.integration.selectDirectory.query(
                {
                  title: "Select where Notesnook should save backups",
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
    header: "Export",
    settings: [
      {
        key: "export-notes",
        title: "Export all notes",
        description: "Export all notes as Markdown, HTML or Plaintext.",
        components: [
          {
            type: "dropdown",
            options: [
              { value: "-", title: "Select format" },
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
