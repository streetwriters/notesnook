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

import { getFileNameWithExtension, Attachment } from "@notesnook/core";
import { db } from "../../common/db";
import { showToast } from "../toast";
import { makeUniqueFilename } from "./utils";
import { ZipFile } from "./zip-stream";
import { logger } from "../logger";
import { decryptFile } from "../../interfaces/fs";

export const METADATA_FILENAME = "metadata.json";
const GROUP_ID = "all-attachments";
export class AttachmentStream extends ReadableStream<ZipFile> {
  constructor(
    ids: string[],
    resolve: (id: string) => Promise<Attachment | undefined> | undefined,
    signal?: AbortSignal,
    onProgress?: (current: number) => void
  ) {
    if (signal)
      signal.onabort = async () => {
        await db.fs().cancel(GROUP_ID);
      };
    super({
      async start(controller) {
        const counters: Record<string, number> = {};
        let index = 0;
        for (const id of ids) {
          if (signal?.aborted) {
            controller.close();
            return;
          }

          onProgress && onProgress(index++);
          const attachment = await resolve(id);
          if (!attachment) return;
          try {
            if (
              !(await db
                .fs()
                .downloadFile(GROUP_ID, attachment.hash, attachment.chunkSize))
            )
              return;

            const key = await db.attachments.decryptKey(attachment.key);
            if (!key) return;

            const file = await decryptFile(attachment.hash, {
              key,
              iv: attachment.iv,
              name: attachment.filename,
              type: attachment.mimeType,
              isUploaded: !!attachment.dateUploaded
            });

            if (file) {
              const filePath: string =
                attachment.filename === attachment.hash
                  ? await getFileNameWithExtension(
                      attachment.hash,
                      attachment.mimeType
                    )
                  : attachment.filename;
              controller.enqueue({
                path: makeUniqueFilename(filePath, counters),
                data: new Uint8Array(await file.arrayBuffer())
              });
            } else {
              throw new Error(
                `Failed to decrypt file (hash: ${attachment.hash}, filename: ${attachment.filename}).`
              );
            }
          } catch (e) {
            logger.error(e, "Failed to download attachment");
            showToast(
              "error",
              `Failed to download attachment: ${(e as Error).message} (hash: ${
                attachment.hash
              }, filename: ${attachment.filename})`
            );
          }
        }
        controller.close();
      }
    });
  }
}
