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
  ContentType,
  LegacyNotebook
} from "@notesnook-importer/core/dist/src/models";
import {
  ATTACHMENTS_DIRECTORY_NAME,
  NOTE_DATA_FILENAME
} from "@notesnook-importer/core/dist/src/utils/note-stream";
import { path } from "@notesnook-importer/core/dist/src/utils/path";
import { type ZipEntry } from "./streams/unzip-stream";
import { hashBuffer, writeEncryptedFile } from "../interfaces/fs";
import { Notebook as NotebookType } from "@notesnook/core";

export async function* importFiles(zipFiles: File[]) {
  const { createUnzipIterator } = await import("./streams/unzip-stream");

  for (const zip of zipFiles) {
    let count = 0;
    let filesRead = 0;

    const attachments: Record<string, any> = {};

    for await (const entry of createUnzipIterator(zip)) {
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
        filesRead
      };
    }
  }
}

async function processAttachment(
  entry: ZipEntry,
  attachments: Record<string, any>
) {
  const name = path.basename(entry.name);
  if (!name || attachments[name] || (await db.attachments?.exists(name)))
    return;

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

const colorMap: Record<string, string | undefined> = {
  default: undefined,
  teal: "#00897B",
  red: "#D32F2F",
  purple: "#7B1FA2",
  blue: "#1976D2",
  cerulean: "#03A9F4",
  pink: "#C2185B",
  brown: "#795548",
  gray: "#9E9E9E",
  green: "#388E3C",
  orange: "#FFA000",
  yellow: "#FFC107"
};

async function processNote(entry: ZipEntry, attachments: Record<string, any>) {
  const note = await fileToJson<Note>(entry);
  for (const attachment of note.attachments || []) {
    const cipherData = attachments[attachment.hash];
    if (!cipherData || (await db.attachments?.exists(attachment.hash)))
      continue;

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

  for (const tag of note.tags || []) {
    const tagId =
      (await db.tags.find(tag))?.id ||
      (await db.tags.add({
        title: tag
      }));
    if (!tagId) continue;

    await db.relations.add(
      {
        id: tagId,
        type: "tag"
      },
      {
        id: noteId,
        type: "note"
      }
    );
  }

  const colorCode = note.color ? colorMap[note.color] : undefined;
  if (colorCode) {
    const colorId =
      (await db.colors.find(colorCode))?.id ||
      (await db.colors.add({
        colorCode: colorCode,
        title: note.color
      }));
    if (!colorId) return;

    await db.relations.add(
      {
        id: colorId,
        type: "color"
      },
      {
        id: noteId,
        type: "note"
      }
    );
  }

  for (const nb of notebooks) {
    if ("notebook" in nb) {
      const notebookId = await importLegacyNotebook(nb).catch(() => undefined);
      if (!notebookId) continue;
      await db.notes.addToNotebook(notebookId, noteId);
    } else {
      const notebookIds = await importNotebook(nb).catch(() => undefined);
      if (!notebookIds) continue;
      for (const notebookId of notebookIds)
        await db.notes.addToNotebook(notebookId, noteId);
    }
  }
}

async function fileToJson<T>(file: ZipEntry) {
  const text = await file.text();
  return JSON.parse(text) as T;
}

/**
 * @deprecated
 */
async function importLegacyNotebook(
  notebook: LegacyNotebook | undefined
): Promise<string | undefined> {
  if (!notebook) return;
  const nb = await db.notebooks.find(notebook.notebook);
  return nb
    ? nb.id
    : await db.notebooks.add({
        title: notebook.notebook
      });
}

async function importNotebook(
  notebook: Notebook,
  parent?: NotebookType
): Promise<string[]> {
  if (!notebook) return [];

  const selector = parent
    ? db.relations.from(parent, "notebook").selector
    : db.notebooks.roots;
  let nb = await selector.find((eb) =>
    eb("notebooks.title", "==", notebook.title)
  );
  if (!nb) {
    const id = await db.notebooks.add({
      title: notebook.title
    });
    if (!id) return [];
    nb = await db.notebooks.notebook(id);
    if (parent && nb) await db.relations.add(parent, nb);
  }
  if (!nb) return [];
  if (notebook.children.length === 0) return [nb.id];

  const assignedNotebooks: string[] = [];
  for (const child of notebook.children || [])
    assignedNotebooks.push(...(await importNotebook(child, nb)));
  return assignedNotebooks;
}
