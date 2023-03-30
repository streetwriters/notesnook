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

import { StreamableFS } from "@notesnook/streamable-fs";
import FS from "../../interfaces/fs";
import { getNNCrypto } from "../../interfaces/nncrypto.stub";
import { db } from "../db";
import { ZipFile } from "./zip-stream";

export type PackageMetadata = {
  version: string;
  attachments: string[];
};

export const METADATA_FILENAME = "metadata.json";

export class AttachmentStream extends ReadableStream<ZipFile> {
  constructor(attachments: Array<any>) {
    super({
      async pull(controller) {
        const token = await db.fs.tokenManager.getAccessToken();
        let index = 0;
        for (const attachment of attachments) {
          if (index > 2) {
            return controller.close();
          }
          const url = `${hosts.API_HOST}/s3?name=${attachment.metadata.hash}`;

          const { execute } = FS.downloadAttachment(attachment.metadata.hash, {
            metadata: attachment.metadata,
            url,
            chunkSize: attachment.chunkSize,
            headers: { Authorization: `Bearer ${token}` }
          });
          await execute();
          const key = await db.attachments?.decryptKey(attachment.key);
          const file = await saveFile(attachment.metadata.hash, {
            key,
            iv: attachment.iv,
            name: attachment.metadata.filename,
            type: attachment.metadata.type,
            isUploaded: !!attachment.dateUploaded
          });
          const filePath = `/${attachment.metadata.hash}`;
          if (file)
            controller.enqueue({
              path: filePath,
              data: file
            });
          index++;
        }
      }
    });
  }
}

async function saveFile(filename: string, fileMetadata: any) {
  if (!fileMetadata) return false;
  const streamablefs = new StreamableFS("streamable-fs");

  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) return false;
  const { key, iv, name, type, isUploaded } = fileMetadata;

  const blobParts: Array<any> = [];
  const reader = fileHandle.getReader();

  const crypto = await getNNCrypto();
  await crypto.decryptStream(
    key,
    iv,
    {
      read: async () => {
        const { value } = await reader.read();
        return value;
      },
      write: async (chunk: any) => {
        blobParts.push(chunk.data);
      }
    },
    filename
  );

  if (isUploaded) await streamablefs.deleteFile(filename);
  return new Blob(blobParts, { type }).arrayBuffer().then((buffer) => {
    return new Uint8Array(buffer);
  });
}

const hosts = {
  API_HOST: "https://api.notesnook.com"
};
