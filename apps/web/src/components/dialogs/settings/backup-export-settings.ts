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
import { useStore as useSettingStore } from "../../../stores/setting-store";
import { useStore as useAppStore } from "../../../stores/app-store";
import { useStore as useUserStore } from "../../../stores/user-store";
import { isUserPremium } from "../../../hooks/use-is-user-premium";
import { createBackup, importBackup, verifyAccount } from "../../../common";
import { db } from "../../../common/db";
import { exportNotes } from "../../../common/export";
import { isDesktop, isTesting } from "../../../utils/platform";
import { desktop } from "../../../common/desktop-bridge";
import { PATHS } from "@notesnook/desktop";

export const BackupExportSettings: SettingsGroup[] = [
  {
    key: "backup",
    section: "backup-export",
    header: "Backups",
    settings: [
      {
        key: "create-backup",
        title: "Backup now",
        description: "Create a backup file containing all your data",
        components: [
          {
            type: "button",
            title: "Create backup",
            action: async () => {
              if (!isUserPremium() && useSettingStore.getState().encryptBackups)
                useSettingStore.getState().toggleEncryptBackups();
              if (await verifyAccount()) await createBackup();
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "restore-backup",
        title: "Restore backup",
        description: "Restore a backup file from your disk drive.",
        isHidden: () => !useUserStore.getState().isLoggedIn && !isTesting(),
        components: [
          {
            type: "button",
            title: "Restore",
            action: async () => {
              await importBackup();
              await useAppStore.getState().refresh();
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "auto-backup",
        title: isDesktop() ? "Automatic backups" : "Backup reminders",
        description: isDesktop()
          ? "Backup all your data automatically at a set interval."
          : "You will be shown regular reminders to backup your data.",
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
            onSelectionChanged: (value) =>
              useSettingStore
                .getState()
                .setBackupReminderOffset(parseInt(value))
          }
        ]
      },
      {
        key: "encrypt-backups",
        title: "Backup encryption",
        description: "Encrypt all backup files using your master key.",
        isHidden: () => !isUserPremium(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((s) => s.encryptBackups, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().encryptBackups,
            toggle: () => useSettingStore.getState().toggleEncryptBackups()
          }
        ]
      },
      {
        key: "backup-directory",
        title: "Backups directory",
        description: "Select directory to store all backup files.",
        isHidden: () => !isDesktop(),
        components: [
          {
            type: "button",
            title: "Select directory",
            action: async () => {
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
              { value: "-", title: "" },
              { value: "txt", title: "Text" },
              { value: "md", title: "Markdown", premium: true },
              { value: "html", title: "HTML", premium: true }
            ],
            selectedOption: () => "-",
            onSelectionChanged: async (value) => {
              if (!db.notes || value === "-") return;

              await db.notes.init();
              await exportNotes(
                value as "txt" | "md" | "html",
                db.notes.all.map((n) => n.id)
              );
            }
          }
        ]
      }
    ]
  }
];
