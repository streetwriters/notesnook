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

import { createBackup, verifyAccount } from "../../common";
import { db } from "../../common/db";
import { exportNotes } from "../../common/export";
import { SettingsGroup } from "./types";

import { strings } from "@notesnook/intl";

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
