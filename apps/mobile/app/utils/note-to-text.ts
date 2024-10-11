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
import { NoteContent, Note } from "@notesnook/core";
import { db } from "../common/database";

export async function convertNoteToText(note: Note, disableTemplate?: boolean) {
  const locked = await db.vaults.itemExists(note);
  if (locked) {
    return await db.notes.export(note.id, {
      contentItem: (note as Note & { content: NoteContent<false> }).content,
      disableTemplate,
      format: "txt"
    });
  }

  return await db.notes.export(note.id, {
    disableTemplate,
    format: "txt"
  });
}
