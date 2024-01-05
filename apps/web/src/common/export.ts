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
import { isDeleted } from "@notesnook/core/dist/types";

const FORMAT_TO_EXT = {
  pdf: "pdf",
  md: "md",
  txt: "txt",
  html: "html",
  "md-frontmatter": "md"
} as const;

export async function exportToPDF(
  title: string,
  content: string
): Promise<boolean> {
  if (!content) return false;

  return new Promise<boolean>((resolve) => {
    const iframe = document.createElement("iframe");

    iframe.srcdoc = content;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.loading = "eager";

    iframe.onload = async () => {
      if (!iframe.contentWindow) return;
      if (iframe.contentDocument) iframe.contentDocument.title = title;
      iframe.contentWindow.onbeforeunload = () => closePrint(false);
      iframe.contentWindow.onafterprint = () => closePrint(true);

      if (
        iframe.contentDocument &&
        !!iframe.contentDocument.querySelector(".math-block,.math-inline")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      iframe.contentWindow.print();
    };

    function closePrint(result: boolean) {
      document.body.removeChild(iframe);
      resolve(result);
    }

    document.body.appendChild(iframe);
  });
}

export async function exportNotes(
  format: "pdf" | "md" | "txt" | "html" | "md-frontmatter",
  noteIds: string[]
): Promise<boolean> {
  return await TaskManager.startTask({
    type: "modal",
    title: "Exporting notes",
    subtitle: "Please wait while your notes are exported.",
    action: async (report) => {
      let vaultUnlocked = false;

      if (noteIds.length === 1 && (await db.notes.locked.has(noteIds[0]))) {
        vaultUnlocked = await Vault.unlockVault();
        if (!vaultUnlocked) return false;
      } else if (noteIds.length > 1 && (await db.vault.exists())) {
        vaultUnlocked = await Vault.unlockVault();
        if (!vaultUnlocked)
          showToast(
            "error",
            "Failed to unlock vault. Locked notes will be skipped."
          );
      }

      const files = [];
      const notes = await db.notes.all.items(noteIds);
      let index = 0;
      for (const note of notes) {
        if (!vaultUnlocked && note.locked) continue;

        report({
          current: ++index,
          total: noteIds.length,
          text: `Exporting "${note.title}"...`
        });

        const rawContent = note.contentId
          ? await db.content.get(note.contentId)
          : null;
        const content =
          !rawContent || isDeleted(rawContent)
            ? undefined
            : rawContent.locked
            ? await db.vault.decryptContent(rawContent, note.id)
            : rawContent;

        const exported = await db.notes
          .export(note.id, {
            format: format === "pdf" ? "html" : format,
            contentItem: content
          })
          .catch((e: Error) => {
            console.error(note, e);
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

        files.push({
          filename: note.title,
          content: exported,
          date: note.dateEdited
        });
      }

      if (!files.length) return false;
      if (files.length === 1) {
        saveAs(
          new Blob([Buffer.from(files[0].content, "utf-8")]),
          `${sanitizeFilename(files[0].filename)}.${FORMAT_TO_EXT[format]}`
        );
      } else {
        const zipped = await zip(files, FORMAT_TO_EXT[format]);
        saveAs(new Blob([zipped.buffer]), "notes.zip");
      }

      return true;
    }
  });
}
