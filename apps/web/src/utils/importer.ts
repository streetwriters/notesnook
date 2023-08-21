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

import { db } from "../common/db";
import {
  Note,
  Notebook,
  ContentType
} from "@notesnook-importer/core/dist/src/models";
import {
  ATTACHMENTS_DIRECTORY_NAME,
  NOTE_DATA_FILENAME
} from "@notesnook-importer/core/dist/src/utils/note-stream";
import { Reader, Entry } from "./zip-reader";
import { path } from "@notesnook-importer/core/dist/src/utils/path";
import { FileEncryptionMetadata } from "@notesnook/core/dist/interfaces";

export async function* importFiles(zipFiles: File[]) {
  for (const zip of zipFiles) {
    let count = 0;
    let filesRead = 0;

    const attachments: Record<string, any> = {};
    const { read, totalFiles } = await Reader(zip);

    for await (const entry of read()) {
      ++filesRead;

      const isAttachment = entry.name.includes(
        `/${ATTACHMENTS_DIRECTORY_NAME}/`
      );
      const isNote = !isAttachment && entry.name.endsWith(NOTE_DATA_FILENAME);

      try {
        if (isAttachment) {
          await processAttachment(entry, attachments);
        } else if (isNote) {
          await processNote(entry, attachments);
          ++count;
        }
      } catch (e) {
        if (e instanceof Error) yield { type: "error" as const, error: e };
      }

      yield {
        type: "progress" as const,
        count,
        totalFiles,
        filesRead
      };
    }
  }
}

async function processAttachment(
  entry: Entry,
  attachments: Record<string, any>
) {
  const name = path.basename(entry.name);
  if (!name || attachments[name] || db.attachments?.exists(name)) return;

  const { hashBuffer, writeEncryptedFile } = await import("../interfaces/fs");

  const data = await entry.arrayBuffer();
  const { hash } = await hashBuffer(new Uint8Array(data));
  if (hash !== name) {
    throw new Error(`integrity check failed: ${name} !== ${hash}`);
  }

  const file = new File([data], name, {
    type: "application/octet-stream"
  });
  const key = await db.attachments?.generateKey();
  const cipherData = await writeEncryptedFile(file, key, name);
  attachments[name] = { ...cipherData, key };
}

async function processNote(entry: Entry, attachments: Record<string, any>) {
  const note = await fileToJson<Note>(entry);
  for (const attachment of note.attachments || []) {
    const cipherData = attachments[attachment.hash];
    if (!cipherData || db.attachments?.exists(attachment.hash)) continue;

    await db.attachments?.add({
      ...cipherData,
      hash: attachment.hash,
      hashType: attachment.hashType,
      filename: attachment.filename,
      type: attachment.mime
    });
  }

  if (!note.content)
    note.content = {
      data: "<p></p>",
      type: ContentType.HTML
    };

  if (note.content?.type === "html") (note.content.type as string) = "tiptap";
  else throw new Error("Invalid content type: " + note.content?.type);

  const notebooks = note.notebooks?.slice() || [];
  note.notebooks = [];
  const noteId = await db.notes.add({
    ...note,
    content: { type: "tiptap", data: note.content?.data },
    notebooks: []
  });
  if (!noteId) return;

  for (const nb of notebooks) {
    const notebook = await importNotebook(nb).catch(() => ({ id: undefined }));
    if (!notebook.id) continue;
    await db.notes.addToNotebook(
      { id: notebook.id, topic: notebook.topic },
      noteId
    );
  }
}

async function fileToJson<T>(file: Entry) {
  const text = await file.text();
  return JSON.parse(text) as T;
}

async function importNotebook(
  notebook: Notebook | undefined
): Promise<{ id?: string; topic?: string }> {
  if (!notebook) return {};

  let nb = db.notebooks.all.find((nb) => nb.title === notebook.notebook);
  if (!nb) {
    const nbId = await db.notebooks.add({
      title: notebook.notebook
    });
    nb = db.notebooks?.notebook(nbId)?.data;
    if (!nb) return {};
  }

  const topic = nb.topics.find((t: any) => t.title === notebook.topic);
  return { id: nb ? nb.id : undefined, topic: topic ? topic.id : undefined };
}
