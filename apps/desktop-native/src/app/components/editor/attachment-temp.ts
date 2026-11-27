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

import { download } from "../../common/attachments";
import { decryptToTempFile } from "../../common/fs";

/**
 * Downloads the attachment if it is not on disk yet and decrypts it to a
 * temporary file. Returns the path; the caller deletes it with
 * `removeTempFile`. Undefined when the attachment cannot be found or read.
 */
export async function decryptAttachmentToTempFile(hash: string) {
  const response = await download(hash);
  if (!response) return;
  const { attachment, key } = response;
  const path = await decryptToTempFile(attachment.hash, {
    key,
    iv: attachment.iv,
    name: attachment.filename,
    type: attachment.mimeType,
    isUploaded: !!attachment.dateUploaded
  });
  return path || undefined;
}
