import RNFetchBlob from "rn-fetch-blob";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { db } from "../database";
import { cacheDir } from "./utils";

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
      if (!attachment.metadata.type.startsWith("image/")) {
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
