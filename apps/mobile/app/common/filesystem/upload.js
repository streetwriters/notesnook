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

import RNFetchBlob from "react-native-blob-util";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { db } from "../database";
import { cacheDir } from "./utils";
import { isImage } from "@notesnook/core/utils/filename";

export async function uploadFile(filename, data, cancelToken) {
  if (!data) return false;
  let { url, headers } = data;

  console.log("uploading file: ", filename, headers);
  try {
    let res = await fetch(url, {
      method: "PUT",
      headers
    });
    if (!res.ok) throw new Error(`${res.status}: Unable to resolve upload url`);
    const uploadUrl = await res.text();
    if (!uploadUrl) throw new Error("Unable to resolve upload url");

    let request = RNFetchBlob.config({
      IOSBackgroundTask: true
    })
      .fetch(
        "PUT",
        uploadUrl,
        {
          "content-type": ""
        },
        RNFetchBlob.wrap(`${cacheDir}/${filename}`)
      )
      .uploadProgress((sent, total) => {
        useAttachmentStore
          .getState()
          .setProgress(sent, total, filename, 0, "upload");
        console.log("uploading: ", sent, total);
      });
    cancelToken.cancel = request.cancel;
    let response = await request;

    let status = response.info().status;
    let text = await response.text();
    let result = status >= 200 && status < 300 && text.length === 0;
    useAttachmentStore.getState().remove(filename);
    if (result) {
      let attachment = db.attachments.attachment(filename);
      if (!attachment) return result;
      if (!isImage(attachment.metadata.type)) {
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log);
      }
    }

    return result;
  } catch (e) {
    useAttachmentStore.getState().remove(filename);
    console.log("upload file: ", e, url, headers);
    return false;
  }
}
