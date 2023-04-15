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

import { hashToUint8Array } from "@notesnook/core/utils/contentMiddleware";
import { register } from "./mitm";
import { ZipStream } from "./zip-stream";
import { createWriteStream } from "./stream-saver";

export type NoteFile = {
  path: string;
  noteContent?: string;
  hash?: string;
};

export const exportStream = async (noteFiles: NoteFile[]) => {
  const textEncoder = new TextEncoder();
  const sourceStream = new ReadableStream({
    async start(controller) {
      let index = 0;
      async function enqeueNextFile() {
        if (index >= noteFiles.length) {
          controller.close();
        }
        const nf = noteFiles[index++];
        if (!nf) return;
        const { path, noteContent, hash } = nf;
        const data = hash
          ? await hashToUint8Array(hash)
          : textEncoder.encode(noteContent);
        const file = { path, data };
        controller.enqueue(file);
        await new Promise((resolve) => setTimeout(resolve, 0));
        enqeueNextFile();
      }
      await enqeueNextFile();
    }
  });
  await register();
  const zipStream = new ZipStream();
  sourceStream
    .pipeThrough(zipStream)
    .pipeTo(createWriteStream("Notes.zip"))
    .catch((err) => console.error("Error creating ZIP archive:", err));
};
