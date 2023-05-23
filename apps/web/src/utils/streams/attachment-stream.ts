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

import { decryptFile } from "../../interfaces/fs";
import { db } from "../../common/db";
import { ZipFile } from "./zip-stream";

export const METADATA_FILENAME = "metadata.json";
const GROUP_ID = "all-attachments";
export class AttachmentStream extends ReadableStream<ZipFile> {
  constructor(
    attachments: Array<any>,
    signal?: AbortSignal,
    onProgress?: (current: number) => void
  ) {
    if (signal)
      signal.onabort = async () => {
        await db.fs.cancel(GROUP_ID, "download");
      };

    let index = 0;
    super({
      start() {},
      async pull(controller) {
        if (signal?.aborted) {
          controller.close();
          return;
        }

        onProgress && onProgress(index);
        const attachment = attachments[index++];

        await db.fs.downloadFile(
          GROUP_ID,
          attachment.metadata.hash,
          attachment.chunkSize,
          attachment.metadata
        );

        const key = await db.attachments?.decryptKey(attachment.key);
        const file = await decryptFile(attachment.metadata.hash, {
          key,
          iv: attachment.iv,
          name: attachment.metadata.filename,
          type: attachment.metadata.type,
          isUploaded: !!attachment.dateUploaded
        });

        if (file) {
          const filePath = `/${attachment.metadata.filename}`;
          controller.enqueue({
            path: filePath,
            data: new Uint8Array(await file.arrayBuffer())
          });
        } else {
          controller.error(new Error("Failed to decrypt file."));
        }

        if (index === attachments.length) {
          controller.close();
        }
      }
    });
  }
}
