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

import { db } from "../../common/db";
import { exportNote } from "../../common/export";
import { makeUniqueFilename } from "./utils";
import { ZipFile } from "./zip-stream";
import { Note } from "@notesnook/core";

export class ExportStream extends TransformStream<Note, ZipFile> {
  constructor(
    format: "pdf" | "md" | "txt" | "html" | "md-frontmatter",
    signal?: AbortSignal
  ) {
    const counters: Record<string, number> = {};

    super({
      async transform(note, controller) {
        try {
          if (signal?.aborted) {
            controller.terminate();
            return;
          }

          if (format === "pdf") return;

          const result = await exportNote(note, { format });
          if (!result) return;

          const { filename, content } = result;

          const notebooks = await db.relations
            .to({ id: note.id, type: "note" }, "notebook")
            .get();

          const filePaths: string[] = [];
          for (const { fromId: notebookId } of notebooks) {
            const crumbs = (await db.notebooks.breadcrumbs(notebookId)).map(
              (n) => n.title
            );
            filePaths.push([...crumbs, filename].join("/"));
          }
          if (filePaths.length <= 0) filePaths.push(filename);

          filePaths.forEach((filePath) => {
            controller.enqueue({
              path: makeUniqueFilename(filePath, counters),
              data: content,
              mtime: new Date(note.dateEdited),
              ctime: new Date(note.dateCreated)
            });
          });
        } catch (e) {
          controller.error(e);
        }
      }
    });
  }
}
