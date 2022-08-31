/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { unzipSync } from "fflate";
import { db } from "../common/db";
import FS from "../interfaces/fs";

const textDecoder = new TextDecoder();
async function getNotesFromImport(files) {
  let notes = [];
  for (let file of files) {
    const unzippedFiles = unzipSync(new Uint8Array(await file.arrayBuffer()));

    let metadata = binaryToJson(unzippedFiles["metadata.json"], undefined);
    if (!metadata) continue;

    const noteIds = metadata["notes"];
    if (!noteIds) continue;

    for (let noteId of noteIds) {
      const path = `${noteId}/note.json`;
      let note = binaryToJson(unzippedFiles[path]);
      if (!note) continue;

      const attachments = note.attachments?.slice() || [];
      note.attachments = [];
      for (let attachment of attachments) {
        const attachmentPath = `${noteId}/attachments/${attachment.hash}`;
        if (!unzippedFiles[attachmentPath]) continue;

        attachment.filename = attachment.filename || attachment.hash;
        attachment.data = unzippedFiles[attachmentPath];

        note.attachments.push(attachment);
      }

      notes.push(note);
    }
  }

  return notes;
}

async function importNote(note) {
  if (note.content.type === "html") note.content.type = "tiptap";
  else throw new Error("Invalid content type: " + note.content.type);

  if (note.attachments) await importAttachments(note.attachments);

  const notebooks = note.notebooks?.slice() || [];
  note.notebooks = [];
  const noteId = await db.notes.add(note);

  for (let notebook of notebooks) {
    await db.notes.move(await importNotebook(notebook), noteId);
  }
}

export const Importer = { importNote, getNotesFromImport };

function binaryToJson(binary, def) {
  if (!binary) return def;
  return JSON.parse(textDecoder.decode(binary));
}

async function importAttachments(attachments) {
  for (let attachment of attachments) {
    const file = new File([attachment.data.buffer], attachment.filename, {
      type: attachment.mime
    });
    if (db.attachments.exists(attachment.hash)) continue;

    const key = await db.attachments.generateKey();
    let output = await FS.writeEncryptedFile(file, key, attachment.hash);
    await db.attachments.add({
      ...output,
      key,
      hash: attachment.hash,
      hashType: attachment.hashType,
      filename: attachment.filename,
      type: attachment.mime
    });
  }
}

async function importNotebook(notebook) {
  let nb = db.notebooks.all.find((nb) => nb.title === notebook.notebook);
  if (!nb) {
    const nbId = await db.notebooks.add({
      title: notebook.notebook,
      topics: [notebook.topic]
    });
    nb = db.notebooks.notebook(nbId).data;
  }

  let topic = nb?.topics.find((t) => t.title === notebook.topic);
  if (!topic) {
    const topics = db.notebooks.notebook(nb).topics;
    await topics.add(notebook.topic);
    topic = topics.all.find((t) => t.title === notebook.topic);
  }

  return { id: nb.id, topic: topic.id };
}
