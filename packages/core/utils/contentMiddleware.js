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

import { HTMLParser } from "./html-rewriter";
import { db } from "../../../apps/web/src/common/db";
import { decryptFile } from "../../../apps/web/src/interfaces/fs";

export async function hashToUint8Array(hash) {
  const attachment = db.attachments.attachment(hash);
  if (!attachment) return;

  const key = await db.attachments.decryptKey(attachment.key);
  const decryptedFile = await decryptFile(attachment.metadata.hash, {
    key,
    iv: attachment.iv,
    name: attachment.metadata.filename,
    type: attachment.metadata.type,
    isUploaded: !!attachment.dateUploaded
  });
  return new Uint8Array(await decryptedFile.arrayBuffer());
}

function extractAttachments(data) {
  let attachments = [];
  const parser = new HTMLParser({
    ontag: (name, attr, pos) => {
      const filename = attr["data-filename"];
      const hash = attr["data-hash"];
      const src = attr["src"];
      if (name == "span") {
        const text = data.substring(pos.start, pos.end + 8); //end position is not accurate it is 8 less for span tags
        return attachments.push({ filename, text, name, hash });
      }
      if (name == "img") {
        const text = data.substring(pos.start, pos.end + 1); //end position is not accurate it is 1 less for img tags
        return attachments.push({ filename, name, src, hash, text });
      }
    }
  });
  parser.parse(data);
  return attachments;
}

export const modifyContent = async (data, format) => {
  const files = [];
  const attachmentContent = extractAttachments(data);

  if (attachmentContent.length <= 0) return { data, files };

  if (format == "txt") {
    for (let i = 0; i < attachmentContent.length; i++) {
      const { text } = attachmentContent[i];
      data = data.replace(text, "");
    }
    return { data, files };
  } else {
    for (let i = 0; i < attachmentContent.length; i++) {
      const { name, text, filename, src, hash } = attachmentContent[i];
      if (name == "img") {
        files.push({ path: filename, hash: hash });
        data = data.replace(src, `./${filename}`);
        continue;
      }
      if (name == "span") {
        files.push({ path: filename, hash: hash });
        data = data.replace(text, `<a href=./${filename}>${filename}</a>`);
        continue;
      }
    }
  }
  return { data, files };
};
