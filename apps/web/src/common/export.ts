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
import { createWriteStream } from "../utils/stream-saver";
import { FilteredSelector } from "@notesnook/core";
import { Note } from "@notesnook/core";
import { fromAsyncIterator } from "../utils/stream";
import {
  sanitizeFilename,
  exportNotes as _exportNotes,
  exportNote as _exportNote,
  exportContent
} from "@notesnook/common";
import Vault from "./vault";
import { ExportStream } from "../utils/streams/export-stream";
import { showToast } from "../utils/toast";
import { ConfirmDialog } from "../dialogs/confirm";
import { db } from "./db";
import { toAsyncIterator } from "@notesnook-importer/core/dist/src/utils/stream";
import { saveAs } from "file-saver";
import { strings } from "@notesnook/intl";

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
  const result = await TaskManager.startTask({
    type: "modal",
    title: strings.exportingNotes(),
    subtitle: strings.exportingNotesDesc(),
    action: async (report) => {
      const { createZipStream } = await import("../utils/streams/zip-stream");

      const errors: Error[] = [];
      const exportStream = new ExportStream(report, (e) => errors.push(e));
      await fromAsyncIterator(
        _exportNotes(notes, { format, unlockVault: Vault.unlockVault })
      )
        .pipeThrough(exportStream)
        .pipeThrough(createZipStream())
        .pipeTo(await createWriteStream("notes.zip"));
      return {
        errors,
        count: exportStream.progress
      };
    }
  });
  if (result instanceof Error) {
    ConfirmDialog.show({
      title: `Export failed`,
      message: result.stack || result.message,
      positiveButtonText: strings.okay()
    });
    return false;
  } else {
    ConfirmDialog.show({
      title: `Exported ${result.count} notes`,
      message:
        result.errors.length > 0
          ? `Export completed with ${result.errors.length} errors:

${result.errors.map((e, i) => `${i + 1}. ${e.message}`).join("\n")}`
          : "Export completed with 0 errors.",
      positiveButtonText: strings.okay()
    });
    return true;
  }
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
  options: {
    format: keyof typeof FORMAT_TO_EXT;
  }
) {
  if (options.format === "pdf") {
    const content = await exportContent(note, {
      format: "pdf",
      unlockVault: Vault.unlockVault
    });
    if (!content) return false;
    console.log(content);
    return await exportToPDF(note.title, content);
  }

  return await TaskManager.startTask({
    type: "modal",
    title: strings.exportingNote(note.title),
    subtitle: strings.exportingNoteDesc(),
    action: async (report) => {
      const hasAttachments =
        (await db.relations.from(note, "attachment").count()) > 0;
      const stream = fromAsyncIterator(
        _exportNote(note, {
          format: options.format,
          unlockVault: Vault.unlockVault
        })
      ).pipeThrough(
        new ExportStream(report, (e) => {
          console.error(e);
          showToast("error", e.message);
        })
      );

      if (hasAttachments) {
        const { createZipStream } = await import("../utils/streams/zip-stream");
        await stream
          .pipeThrough(createZipStream())
          .pipeTo(
            await createWriteStream(
              `${sanitizeFilename(note.title, { replacement: "-" })}.zip`
            )
          );
      } else {
        for await (const file of toAsyncIterator(stream)) {
          if (typeof file.data === "string")
            saveAs(new Blob([Buffer.from(file.data, "utf-8")]), file.path);
          else if (file.data instanceof Uint8Array)
            saveAs(new Blob([file.data]), file.path);
          else await file.data.pipeTo(await createWriteStream(file.path));
        }
      }
      return true;
    }
  });
}
