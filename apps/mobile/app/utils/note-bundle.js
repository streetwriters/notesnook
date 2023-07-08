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

import Sodium from "@ammarahmed/react-native-sodium";
import { isImage } from "@notesnook/core/utils/filename";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import { db } from "../common/database";
import { IOS_APPGROUPID } from "./constants";

export async function attachFile(uri, hash, type, filename, options) {
  try {
    let exists = db.attachments.exists(hash);
    let encryptionInfo;
    if (options?.hash && options.hash !== hash) return false;

    if (!exists || options?.reupload) {
      let key = await db.attachments.generateKey();
      encryptionInfo = await Sodium.encryptFile(key, {
        uri: uri,
        type: options.type || "url",
        hash: hash,
        appGroupId: options.appGroupId
      });
      encryptionInfo.type = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = "xcha-stream";
      encryptionInfo.size = encryptionInfo.length;
      encryptionInfo.key = key;
      if (options?.reupload && exists) await db.attachments.reset(hash);
    } else {
      encryptionInfo = { hash: hash };
    }
    await db.attachments.add(encryptionInfo, options?.id);
    return true;
  } catch (e) {
    if (Platform.OS === "ios") RNFetchBlob.fs.unlink(uri).catch(console.log);
    console.log("attach file error: ", e);
    return false;
  }
}

async function createNotes(bundle) {
  const sessionId = bundle.note.sessionId;
  const id = await db.notes.add(bundle.note);

  for (const item of bundle.notebooks) {
    if (item.type === "notebook") {
      db.relations.add(item, { id, type: "note" });
    } else {
      db.notes.addToNotebook(
        {
          id: item.notebookId,
          topic: item.id
        },
        id
      );
    }
  }

  for (const file of bundle.files) {
    const uri =
      Platform.OS === "ios"
        ? `${file.value.replace("file://", "")}`
        : `${file.value}`;
    const hash = await Sodium.hashFile({
      uri: uri,
      type: "cache"
    });
    await attachFile(uri, hash, file.type, file.name, {
      type: "cache",
      id: id,
      appGroupId: IOS_APPGROUPID
    });
    let content = ``;
    if (isImage(file.type)) {
      content = `<img data-hash="${hash}" data-mime="${file.type}" data-filename="${file.name}" />`;
    } else {
      content = `<p><span data-hash="${hash}" data-mime="${file.type}" data-filename="${file.name}" data-size="${file.size}" /></p>`;
    }
    const rawContent = await db.content.raw(db.notes.note(id).data?.contentId);
    await db.notes.add({
      id: id,
      content: {
        type: "tiptap",
        data: rawContent?.data ? rawContent?.data + content : content
      },
      sessionId: sessionId
    });
  }
}

export const NoteBundle = {
  createNotes
};
