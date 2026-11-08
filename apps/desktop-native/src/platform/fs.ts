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

import type { FileEncryptionMetadata, IFileStorage } from "@notesnook/core";
import type { SerializedKey } from "@notesnook/crypto";
import type { StreamableFS } from "@notesnook/streamable-fs";
import type { PickedFile } from "./files";

export type FileMetadata = {
  key: SerializedKey;
  iv: string;
  name: string;
  type: string;
  isUploaded: boolean;
};

export interface AttachmentFiles {
  storage: IFileStorage;
  streamablefs: StreamableFS;
  writeEncryptedFile(
    file: PickedFile,
    key: SerializedKey,
    hash: string
  ): Promise<FileEncryptionMetadata>;
  checkUpload(
    filename: string,
    chunkSize: number,
    expectedSize: number
  ): Promise<void>;
  getUploadedFileSize(filename: string): Promise<number>;
  decryptFile(
    filename: string,
    fileMetadata: FileMetadata
  ): Promise<Uint8Array | false>;
  streamingDecryptFile(
    filename: string,
    fileMetadata: FileMetadata
  ): Promise<ReadableStream<Uint8Array> | false>;
  saveFile(filename: string, fileMetadata: FileMetadata): Promise<void>;
}
