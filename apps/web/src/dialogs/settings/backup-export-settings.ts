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
import { formatDate } from "@notesnook/core";
import { BACKUP_CRON_EXPRESSIONS, FULL_BACKUP_CRON_EXPRESSIONS } from "../../common/notices";
import { CronosExpression } from "cronosjs";
import dayjs from "dayjs";

function getNextBackupTime(
  offset: number,
  lastBackupDate?: number,
  isFull: boolean = false
): number | undefined {
  if (offset === 0 || !lastBackupDate) return undefined;
  try {
    const cronString = isFull
      ? FULL_BACKUP_CRON_EXPRESSIONS[offset as keyof typeof FULL_BACKUP_CRON_EXPRESSIONS]
      : BACKUP_CRON_EXPRESSIONS[offset as keyof typeof BACKUP_CRON_EXPRESSIONS];

    if (!cronString) return undefined;

    const expr = CronosExpression.parse(cronString);
    const nextDate = expr.nextDate(new Date(lastBackupDate));
    return nextDate ? nextDate.getTime() : undefined;
  } catch (e) {
    return undefined;
  }
}

const getDesktopBackupsDirectoryPath = () =>
  useSettingStore.getState().backupStorageLocation;

export const BackupExportSettings: SettingsGroup[] = [
  {
    key: "backup",
    section: "backup-export",
    header: strings.backups(),
    settings: [
      {
        key: "create-backup",
        title: strings.backupNow(),
        description: () => {
          const s = useSettingStore.getState();
          const partial = s.lastBackupTime || 0;
          const full = s.lastFullBackupTime || 0;
          const last = Math.max(partial, full);

          if (!last) return strings.backupNowDesc();

          const formattedDate = formatDate(last, { type: "date-time", dateFormat: s.dateFormat, timeFormat: s.timeFormat });
          const backupStr = last === full ? strings.lastFullBackupOn(formattedDate) : strings.lastPartialBackupOn(formattedDate);
          return `${strings.backupNowDesc()}\n${backupStr}`;
        },
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => `${s.lastBackupTime}-${s.lastFullBackupTime}`,
            listener
          ),
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
        description: () => {
          const s = useSettingStore.getState();
          const next = getNextBackupTime(
            s.backupReminderOffset,
            s.lastBackupTime,
            false
          );
          return next
            ? `${strings.automaticBackupsDesc()}\n${strings.nextBackupOn(
                formatDate(next, {
                  type: "date-time",
                  dateFormat: s.dateFormat,
                  timeFormat: s.timeFormat
                })
              )}`
            : strings.automaticBackupsDesc();
        },
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => `${s.backupReminderOffset}-${s.lastBackupTime}`,
            listener
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "0", title: strings.never() },
              { value: "1", title: strings.daily() },
              { value: "2", title: strings.weekly() },
              { value: "3", title: strings.monthly() }
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
        description: () => {
          const s = useSettingStore.getState();
          const next = getNextBackupTime(
            s.fullBackupReminderOffset,
            s.lastFullBackupTime,
            true
          );
          const base = strings
            .automaticBackupsWithAttachmentsDesc()
            .join("\n\n");
          return next
            ? `${base}\n${strings.nextBackupOn(
                formatDate(next, {
                  type: "date-time",
                  dateFormat: s.dateFormat,
                  timeFormat: s.timeFormat
                })
              )}`
            : base;
        },
        onStateChange: (listener) =>
          useSettingStore.subscribe(
            (s) => `${s.fullBackupReminderOffset}-${s.lastFullBackupTime}`,
            listener
          ),
        components: [
          {
            type: "dropdown",
            options: [
              { value: "0", title: strings.never() },
              { value: "1", title: strings.weekly() },
              { value: "2", title: strings.monthly() }
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

              await desktop?.integration.selectBackupDirectory.query();

              useSettingStore.setState({
                backupStorageLocation:
                  await desktop?.integration.backupDirectory.query()
              });
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
              { value: "md", title: "Markdown" },
              {
                value: "md-frontmatter",
                title: "Markdown + Frontmatter"
              },
              { value: "html", title: "HTML" }
            ],
            selectedOption: () => "-",
            onSelectionChanged: async (value) => {
              if (!db.notes || value === "-") return;
              if (await verifyAccount())
                await exportNotes(
                  value as "txt" | "md" | "html" | "md-frontmatter",
                  db.notes.exportable
                );
            }
          }
        ]
      }
    ]
  }
];
