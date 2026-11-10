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

import { exportContent, sanitizeFilename } from "@notesnook/common";
import type { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { shell } from "@platform";
import { createWritableStream, createWriteStream } from "../utils/stream-saver";
import { showToast } from "../utils/toast";
import { TaskManager } from "./task-manager";
import Vault from "./vault";

let printOutputPath: string | undefined;
let exportDirectory: string | undefined;

export function configurePrintExport(options: {
  printOutputPath?: string;
  exportDirectory?: string;
}) {
  printOutputPath = options.printOutputPath;
  exportDirectory = options.exportDirectory;
}

async function noteHtml(note: Note) {
  return exportContent(note, {
    format: "pdf",
    disableTemplate: true,
    unlockVault: Vault.unlockVault
  });
}

function failed(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  showToast("error", message);
  return false;
}

export async function printNote(note: Note): Promise<boolean> {
  const result = await TaskManager.startTask({
    type: "modal",
    title: strings.print(),
    subtitle: note.title,
    action: async () => {
      const html = await noteHtml(note);
      if (html === undefined) return false;
      return shell.printHtml(note.title, html, {
        outputPath: printOutputPath
      });
    }
  });
  return result instanceof Error ? failed(result) : result;
}

export async function exportNotePdf(note: Note): Promise<boolean> {
  const result = await TaskManager.startTask({
    type: "modal",
    title: strings.exportingNote(note.title),
    subtitle: strings.exportingNoteDesc(),
    action: async () => {
      const html = await noteHtml(note);
      if (html === undefined) return false;
      const pdf = await shell.htmlToPdf(note.title, html);
      if (!pdf) return shell.printHtml(note.title, html);
      const filename = `${sanitizeFilename(note.title || "Untitled", {
        replacement: "-"
      })}.pdf`;
      const stream = exportDirectory
        ? await createWritableStream(`${exportDirectory}/${filename}`)
        : await createWriteStream(filename);
      const writer = stream.getWriter();
      await writer.write(pdf);
      await writer.close();
      return true;
    }
  });
  return result instanceof Error ? failed(result) : result;
}
