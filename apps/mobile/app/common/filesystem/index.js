import {
  downloadAttachment,
  downloadFile,
  getUploadedFileSize,
  checkAttachment
} from "./download";
import {
  clearFileStorage,
  deleteFile,
  exists,
  readEncrypted,
  writeEncrypted
} from "./io";
import { uploadFile } from "./upload";
import { cancelable } from "./utils";

export default {
  readEncrypted,
  writeEncrypted,
  uploadFile: cancelable(uploadFile),
  downloadFile: cancelable(downloadFile),
  deleteFile,
  exists,
  downloadAttachment,
  clearFileStorage,
  getUploadedFileSize,
  checkAttachment
};
