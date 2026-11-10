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
import { isImage } from "@notesnook/core";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import { DatabaseLogger, db } from "../common/database";
import { santizeUri } from "../common/filesystem/utils";
import { IOS_APPGROUPID } from "./constants";
import {
  CompressedImage,
  compressImage,
  getCompressionType,
  unlinkFile
} from "../common/filesystem/compress";
import type { ShareItem } from "@ammarahmed/react-native-share-extension";

type AttachFileOptions = {
  type?: "base64" | "url" | "cache";
  hash?: string;
  appGroupId?: string;
  reupload?: boolean;
  id?: string;
};

export type NoteBundle = {
  note: {
    id?: string;
    title?: string;
    sessionId?: number | string;
    content?: { type: string; data?: string };
  };
  notebooks?: string[];
  tags?: string[];
  files: ShareItem[];
  compress?: boolean;
  /** Pre-compressed results, keyed by file value. */
  compressedImages?: Record<string, CompressedImage>;
};

export async function attachFile(
  uri: string,
  hash: string,
  type: string,
  filename: string,
  options: AttachFileOptions
) {
  try {
    const exists = await db.attachments.exists(hash);
    let encryptionInfo: Parameters<typeof db.attachments.add>[0];
    if (options?.hash && options.hash !== hash) return false;

    if (!exists || options?.reupload) {
      const key = await db.attachments.generateKey();
      encryptionInfo = await Sodium.encryptFile(key, {
        uri: uri,
        type: options.type || "url",
        hash: hash,
        appGroupId: options.appGroupId
      } as Parameters<typeof Sodium.encryptFile>[1]);
      encryptionInfo.mimeType = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = "xcha-stream";
      encryptionInfo.key = key;

      if (options?.reupload && exists) await db.attachments.reset(hash);
    } else {
      encryptionInfo = { hash: hash };
    }
    await db.attachments.add(encryptionInfo);
    return true;
  } catch (e) {
    if (Platform.OS === "ios")
      RNFetchBlob.fs.unlink(uri).catch(() => {
        /* empty */
      });
    DatabaseLogger.error(e, "Attach file error");

    return false;
  }
}

async function createNotes(bundle: NoteBundle) {
  const sessionId = bundle.note.sessionId;
  const id = await db.notes.add(
    bundle.note as Parameters<typeof db.notes.add>[0]
  );

  if (!bundle.notebooks || !bundle.notebooks.length) {
    const defaultNotebook = db.settings?.getDefaultNotebook();
    if (defaultNotebook) {
      await db.notes.addToNotebook(defaultNotebook, id);
    }
  } else {
    for (const item of bundle.notebooks) {
      await db.notes.addToNotebook(item, id);
    }
  }

  if (bundle.tags) {
    for (const tagId of bundle.tags) {
      if (await db.tags.exists(tagId)) {
        await db.relations.add(
          {
            type: "tag",
            id: tagId
          },
          {
            id: id,
            type: "note"
          }
        );
      }
    }
  }
  const compress = bundle.compress;

  for (const file of bundle.files) {
    let uri = Platform.OS === "ios" ? santizeUri(file.value) : `${file.value}`;

    const type = getCompressionType(file.type);
    let size = file.size;

    if (type && compress) {
      const path = "file://" + uri;
      const res =
        bundle.compressedImages?.[file.value] ??
        (await compressImage(path, type, file.size));
      if (!res.original) unlinkFile(path);
      uri = res.uri.replace("file://", "");
      size = res.size;
    }

    const hash = await Sodium.hashFile({
      uri: uri,
      type: "cache"
    });
    const attached = await attachFile(uri, hash, file.type, file.name, {
      type: "cache",
      id: id,
      appGroupId: IOS_APPGROUPID
    });
    let content = ``;

    if (attached) {
      if (isImage(file.type)) {
        content = `<img data-hash="${hash}" data-mime="${file.type}" data-filename="${file.name}" data-size="${size}" />`;
      } else {
        content = `<p><span data-hash="${hash}" data-mime="${file.type}" data-filename="${file.name}" data-size="${size}" /></p>`;
      }
      const note = await db.notes.note(id);
      const rawContent = note?.contentId
        ? await db.content.get(note.contentId)
        : undefined;
      await db.notes.add({
        id: id,
        content: {
          type: "tiptap",
          data: rawContent?.data ? rawContent?.data + content : content
        },
        sessionId: sessionId as string | undefined
      });
    }
  }
}

export const NoteBundle = {
  createNotes
};
