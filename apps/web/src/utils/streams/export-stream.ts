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

import Note from "@notesnook/core/dist/models/note";
import { db } from "../../common/db";
import { exportNote } from "../../common/export";
import { makeUniqueFilename } from "./utils";
import { ZipFile } from "./zip-stream";

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

          if (!note || format === "pdf") return;

          const result = await exportNote(note, format);
          if (!result) return;

          const { filename, content } = result;

          const notebooks = [
            ...(
              db.relations?.to({ id: note.id, type: "note" }, "notebook") || []
            ).map((n) => ({ title: n.title, topics: [] })),
            ...(note.notebooks || []).map(
              (ref: { id: string; topics: string[] }) => {
                const notebook = db.notebooks?.notebook(ref.id);
                const topics: any[] = notebook?.topics.all || [];

                return {
                  title: notebook?.title,
                  topics: ref.topics
                    .map((topicId: string) =>
                      topics.find((topic) => topic.id === topicId)
                    )
                    .filter(Boolean)
                };
              }
            )
          ];

          const filePaths: Array<string> =
            notebooks.length > 0
              ? notebooks
                  .map((notebook) => {
                    if (notebook.topics.length > 0)
                      return notebook.topics.map((topic: { title: string }) =>
                        [notebook.title, topic.title, filename].join("/")
                      );
                    return [notebook.title, filename].join("/");
                  })
                  .flat()
              : [filename];

          filePaths.forEach((filePath) => {
            controller.enqueue({
              path: makeUniqueFilename(filePath, counters),
              data: content,
              mtime: new Date(note.data.dateEdited),
              ctime: new Date(note.data.dateCreated)
            });
          });
        } catch (e) {
          controller.error(e);
        }
      }
    });
  }
}
