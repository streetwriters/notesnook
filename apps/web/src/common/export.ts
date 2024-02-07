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

import { TaskManager } from "./task-manager";
import { ExportStream } from "../utils/streams/export-stream";
import { createZipStream } from "../utils/streams/zip-stream";
import { createWriteStream } from "../utils/stream-saver";
import { FilteredSelector } from "@notesnook/core/dist/database/sql-collection";
import { Note, isDeleted } from "@notesnook/core";
import { fromAsyncIterator } from "../utils/stream";
import { db } from "./db";
import { ExportOptions } from "@notesnook/core/dist/collections/notes";
import { showToast } from "../utils/toast";
import { sanitizeFilename } from "@notesnook/common";
import Vault from "./vault";

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
  notes: FilteredSelector<Note>
): Promise<boolean> {
  return await TaskManager.startTask({
    type: "modal",
    title: "Exporting notes",
    subtitle: "Please wait while your notes are exported.",
    action: async (report) => {
      const total = await notes.count();
      let progress = 0;

      const noteStream = fromAsyncIterator(notes[Symbol.asyncIterator]());
      await noteStream
        .pipeThrough(
          new TransformStream<Note, Note>({
            transform(note, controller) {
              controller.enqueue(note);
              report({
                total,
                current: progress++,
                text: `Exporting "${note?.title}"`
              });
            }
          })
        )
        .pipeThrough(new ExportStream(format, undefined))
        .pipeThrough(createZipStream())
        .pipeTo(await createWriteStream("notes.zip"));
      return true;
    }
  });
}

const FORMAT_TO_EXT = {
  pdf: "pdf",
  md: "md",
  txt: "txt",
  html: "html",
  "md-frontmatter": "md"
} as const;

export async function exportNote(
  note: Note,
  options: Omit<ExportOptions, "contentItem" | "format"> & {
    format: keyof typeof FORMAT_TO_EXT;
  }
) {
  if (
    !db.vault.unlocked &&
    (await db.vaults.itemExists(note)) &&
    !(await Vault.unlockVault())
  ) {
    showToast("error", `Skipping note "${note.title}" as it is locked.`);
    return false;
  }
  const rawContent = note.contentId
    ? await db.content.get(note.contentId)
    : undefined;

  const content =
    rawContent &&
    !isDeleted(rawContent) &&
    (rawContent.locked
      ? await db.vault.decryptContent(rawContent, note.id)
      : rawContent);

  const exported = await db.notes
    .export(note.id, {
      ...options,
      format: options.format === "pdf" ? "html" : options.format,
      contentItem: content || undefined
    })
    .catch((e: Error) => {
      showToast("error", `Failed to export note "${note.title}": ${e.message}`);
      return false as const;
    });

  if (typeof exported === "boolean" && !exported) return false;

  const filename = sanitizeFilename(note.title, { replacement: "-" });
  const ext = FORMAT_TO_EXT[options.format];
  return {
    filename: [filename, ext].join("."),
    content: exported
  };
}
