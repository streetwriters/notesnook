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

import { sanitizeFilename } from "@notesnook/common";
import { db } from "../../common/db";
import { exportToPDF } from "../../common/export";
import Vault from "../../common/vault";
import { showToast } from "../toast";
import { makeUniqueFilename } from "./utils";
import { ZipFile } from "./zip-stream";

const FORMAT_TO_EXT = {
  pdf: "pdf",
  md: "md",
  txt: "txt",
  html: "html",
  "md-frontmatter": "md"
} as const;

export class ExportStream extends ReadableStream<ZipFile> {
  constructor(
    noteIds: string[],
    format: "pdf" | "md" | "txt" | "html" | "md-frontmatter",
    signal?: AbortSignal,
    onProgress?: (current: number, text: string) => void
  ) {
    const textEncoder = new TextEncoder();
    let index = 0;
    const counters: Record<string, number> = {};
    let vaultUnlocked = false;

    super({
      async start() {
        if (noteIds.length === 1 && db.notes?.note(noteIds[0])?.data.locked) {
          vaultUnlocked = await Vault.unlockVault();
          if (!vaultUnlocked) return false;
        } else if (noteIds.length > 1 && (await db.vault?.exists())) {
          vaultUnlocked = await Vault.unlockVault();
          if (!vaultUnlocked)
            showToast(
              "error",
              "Failed to unlock vault. Locked notes will be skipped."
            );
        }
      },
      async pull(controller) {
        if (signal?.aborted) {
          controller.close();
          return;
        }

        const note = db.notes?.note(noteIds[index++]);
        if (!note) return;
        if (!vaultUnlocked && note.data.locked) return;

        onProgress && onProgress(index, `Exporting "${note.title}"...`);

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
          return;
        }

        if (format === "pdf") {
          await exportToPDF(note.title, exported);
          controller.close();
          return;
        }

        const filename = sanitizeFilename(note.title, { replacement: "-" });
        const ext = FORMAT_TO_EXT[format];
        const notebooksWithoutTopics = db.relations?.to(
          { id: note.id, type: "note" },
          "notebook"
        );
        const notebooksWithTopics = note?.notebooks;
        const notebooks: Array<{ title: string; topics: Array<string> }> = [];

        notebooksWithoutTopics?.forEach((notebook) => {
          notebooks.push({ title: notebook.title, topics: [] });
        });

        notebooksWithTopics?.forEach((notebook: any) => {
          const _topics = db.notebooks?.notebook(notebook.id).topics.all;
          const topics: Array<string> = [];

          notebook?.topics?.forEach((topicId: string) => {
            _topics?.forEach((topic) => {
              if (topic.id === topicId) {
                topics.push(topic.title);
              }
            });
          });

          notebooks.push({
            title: db.notebooks?.notebook(notebook.id).title,
            topics: topics
          });
        });

        const paths: Array<string> = [];
        if (notebooks?.length > 0) {
          notebooks.forEach((notebook) => {
            if (notebook.topics.length > 0)
              notebook.topics.forEach((topic) => {
                paths.push(
                  makeUniqueFilename(
                    [filename, ext].join("."),
                    counters,
                    notebook.title,
                    topic
                  )
                );
              });
            else
              paths.push(
                makeUniqueFilename(
                  [filename, ext].join("."),
                  counters,
                  notebook.title
                )
              );
          });
        } else {
          paths.push(makeUniqueFilename([filename, ext].join("."), counters));
        }

        paths.forEach((path) => {
          controller.enqueue({
            path,
            data: textEncoder.encode(exported),
            mtime: new Date(note.data.dateEdited),
            ctime: new Date(note.data.dateCreated)
          });
        });

        if (index === noteIds.length) {
          controller.close();
        }
      }
    });
  }
}
