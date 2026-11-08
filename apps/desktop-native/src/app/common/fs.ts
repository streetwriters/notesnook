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

import { attachmentFiles } from "@platform";

export const ABYTES = 17;
export const streamablefs = attachmentFiles.streamablefs;

export const writeEncryptedFile: typeof attachmentFiles.writeEncryptedFile = (
  ...args
) => attachmentFiles.writeEncryptedFile(...args);
export const checkUpload: typeof attachmentFiles.checkUpload = (...args) =>
  attachmentFiles.checkUpload(...args);
export const getUploadedFileSize: typeof attachmentFiles.getUploadedFileSize = (
  ...args
) => attachmentFiles.getUploadedFileSize(...args);
export const decryptFile: typeof attachmentFiles.decryptFile = (...args) =>
  attachmentFiles.decryptFile(...args);
export const streamingDecryptFile: typeof attachmentFiles.streamingDecryptFile =
  (...args) => attachmentFiles.streamingDecryptFile(...args);
export const saveFile: typeof attachmentFiles.saveFile = (...args) =>
  attachmentFiles.saveFile(...args);
