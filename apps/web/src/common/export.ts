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

import { db } from "./db";
import { TaskManager } from "./task-manager";
import { zip } from "../utils/zip";
import { saveAs } from "file-saver";
import { showToast } from "../utils/toast";
import { sanitizeFilename } from "@notesnook/common";
import Vault from "./vault";

export async function exportToPDF(
  title: string,
  content: string
): Promise<boolean> {
  if (!content) return false;
  const { default: printjs } = await import("print-js");
  const _content = content.replaceAll(/<p [a-z\-="]*><\/p>/gm, "<p>&nbsp;</p>");
  return new Promise((resolve) => {
    printjs({
      printable: _content,
      targetStyles: "*",
      type: "raw-html",
      documentTitle: title,
      header: '<h3 class="custom-h3">My custom header</h3>',
      onPrintDialogClose: () => {
        resolve(false);
      },
      onError: () => resolve(false)
    });
    resolve(true);
  });
}

export async function exportNotes(
  format: "pdf" | "md" | "txt" | "html",
  noteIds: string[]
): Promise<boolean> {
  return await TaskManager.startTask({
    type: "modal",
    title: "Exporting notes",
    subtitle: "Please wait while your notes are exported.",
    action: async (report) => {
      let vaultUnlocked = false;

      if (noteIds.length === 1 && db.notes?.note(noteIds[0])?.data.locked) {
        vaultUnlocked = await Vault.unlockVault();
        if (!vaultUnlocked) return false;
      } else if (noteIds.length > 1 && (await db.vault?.exists()))
        vaultUnlocked = await Vault.unlockVault();

      if (!vaultUnlocked)
        showToast(
          "error",
          "Failed to unlock vault. Locked notes will be skipped."
        );

      const files = [];
      let index = 0;
      for (const noteId of noteIds) {
        const note = db.notes?.note(noteId);
        if (!note) continue;
        if (!vaultUnlocked && note.data.locked) continue;

        report({
          current: ++index,
          total: noteIds.length,
          text: `Exporting "${note.title}"...`
        });

        const rawContent = await db.content?.raw(note.data.contentId);
        const content = note.data.locked
          ? await db.vault?.decryptContent(rawContent)
          : rawContent;

        const exported = await note
          .export(format === "pdf" ? "html" : format, content)
          .catch((e: Error) => {
            console.error(note.data, e);
            showToast(
              "error",
              `Failed to export note "${note.title}": ${e.message}`
            );
          });

        if (typeof exported !== "string") {
          showToast("error", `Failed to export note "${note.title}"`);
          continue;
        }

        if (format === "pdf") {
          return await exportToPDF(note.title, exported);
        }

        files.push({ filename: note.title, content: exported });
      }

      if (!files.length) return false;
      if (files.length === 1) {
        saveAs(
          new Blob([Buffer.from(files[0].content, "utf-8")]),
          `${sanitizeFilename(files[0].filename)}.${format}`
        );
      } else {
        const zipped = await zip(files, format);
        saveAs(new Blob([zipped.buffer]), "notes.zip");
      }

      return true;
    }
  });
}
