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

import { IFileStorage } from "@notesnook/core";
import { checkAttachment, downloadFile } from "./download";
import {
  bulkExists,
  clearCache,
  clearFileStorage,
  deleteCacheFileByName,
  deleteCacheFileByPath,
  deleteFile,
  exists,
  getCacheSize,
  hashBase64,
  readEncrypted,
  writeEncryptedBase64
} from "./io";
import { uploadFile } from "./upload";
import {
  cancelable,
  checkAndCreateDir,
  getUploadedFileSize,
  requestPermission
} from "./utils";

export default {
  checkAttachment,
  clearCache,
  deleteCacheFileByName,
  deleteCacheFileByPath,
  getCacheSize,
  requestPermission,
  checkAndCreateDir
};

export const FileStorage: IFileStorage = {
  readEncrypted,
  writeEncryptedBase64,
  hashBase64,
  uploadFile: cancelable(uploadFile),
  downloadFile: cancelable(downloadFile),
  deleteFile,
  exists,
  clearFileStorage,
  getUploadedFileSize,
  bulkExists
};
