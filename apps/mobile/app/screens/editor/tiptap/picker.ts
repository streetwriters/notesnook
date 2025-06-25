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
import { basename } from "pathe";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import DocumentPicker, {
  DocumentPickerOptions,
  DocumentPickerResponse
} from "react-native-document-picker";
import { Image, openCamera, openPicker } from "react-native-image-crop-picker";
import { DatabaseLogger, db } from "../../../common/database";
import filesystem from "../../../common/filesystem";
import { compressToFile } from "../../../common/filesystem/compress";
import AttachImage from "../../../components/dialogs/attach-image-dialog";
import {
  ToastManager,
  eSendEvent,
  presentSheet
} from "../../../services/event-manager";
import PremiumService from "../../../services/premium";
import { useSettingStore } from "../../../stores/use-setting-store";
import { FILE_SIZE_LIMIT, IMAGE_SIZE_LIMIT } from "../../../utils/constants";
import { eCloseSheet } from "../../../utils/events";
import { useTabStore } from "./use-tab-store";
import { editorController, editorState } from "./utils";
import { strings } from "@notesnook/intl";
import { useUserStore } from "../../../stores/use-user-store";

const showEncryptionSheet = (file: DocumentPickerResponse) => {
  presentSheet({
    title: strings.encryptingAttachment(),
    paragraph: strings.encryptingAttachmentDesc(file.name),
    icon: "attachment"
  });
};

const santizeUri = (uri: string) => {
  uri = decodeURI(uri);
  uri = Platform.OS === "ios" ? uri.replace("file:///", "/") : uri;
  return uri;
};

type PickerOptions = {
  noteId?: string;
  tabId?: string;
  type: "image" | "camera" | "file";
  reupload: boolean;
  hash?: string;
  context?: string;
  outputType?: "base64" | "url" | "cache";
};

const file = async (fileOptions: PickerOptions) => {
  try {
    const options: DocumentPickerOptions<"ios"> = {
      mode: "import",
      allowMultiSelection: false
    };
    if (Platform.OS === "ios") {
      options.copyTo = "cachesDirectory";
    }
    await db.attachments.generateKey();

    let file;
    try {
      useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
      file = await DocumentPicker.pick(options);
    } catch (e) {
      return;
    }

    file = file[0];

    let uri = Platform.OS === "ios" ? file.fileCopyUri || file.uri : file.uri;

    if ((file.size || 0) > FILE_SIZE_LIMIT) {
      ToastManager.show({
        heading: strings.fileTooLarge(),
        message: strings.fileTooLargeDesc(500),
        type: "error"
      });
      return;
    }

    if (file.copyError) {
      ToastManager.show({
        heading: strings.failToOpen(),
        message: file.copyError,
        type: "error",
        context: "global"
      });
      return;
    }

    uri = Platform.OS === "ios" ? santizeUri(uri) : uri;
    showEncryptionSheet(file);
    const hash = await Sodium.hashFile({
      uri: uri,
      type: "url"
    });
    if (
      !(await attachFile(
        uri,
        hash,
        file.type || "application/octet-stream",
        file.name,
        fileOptions
      ))
    ) {
      throw new Error("Failed to attach file");
    }
    if (Platform.OS === "ios") await RNFetchBlob.fs.unlink(uri);

    if (
      fileOptions.tabId !== undefined &&
      useTabStore.getState().getNoteIdForTab(fileOptions.tabId) ===
        fileOptions.noteId
    ) {
      if (isImage(file.type || "application/octet-stream")) {
        editorController.current?.commands.insertImage(
          {
            hash: hash,
            filename: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size || 0,
            dataurl: (await db.attachments.read(hash, "base64")) as string,
            type: "image"
          },
          fileOptions.tabId
        );
      } else {
        editorController.current?.commands.insertAttachment(
          {
            hash: hash,
            filename: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size || 0,
            type: "file"
          },
          fileOptions.tabId
        );
      }
    } else {
      throw new Error("Failed to attach file, no tabId is set");
    }

    eSendEvent(eCloseSheet);
  } catch (e) {
    eSendEvent(eCloseSheet);
    ToastManager.show({
      heading: (e as Error).message,
      type: "error",
      context: "global"
    });
    DatabaseLogger.error(e);
  }
};

const camera = async (options: PickerOptions) => {
  try {
    await db.attachments.generateKey();
    useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
    openCamera({
      mediaType: "photo",
      includeBase64: true,
      cropping: false,
      multiple: true,
      maxFiles: 10,
      writeTempFile: true,
      compressImageQuality: 1
    })
      .then((response) => {
        handleImageResponse(
          Array.isArray(response) ? response : [response],
          options
        );
      })
      .catch((e) => {});
  } catch (e) {
    ToastManager.show({
      heading: (e as Error).message,
      type: "error",
      context: "global"
    });
  }
};

const gallery = async (options: PickerOptions) => {
  try {
    await db.attachments.generateKey();
    useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
    openPicker({
      includeBase64: true,
      mediaType: "photo",
      maxFiles: 10,
      cropping: false,
      multiple: true,
      compressImageQuality: 1
    })
      .then((response) =>
        handleImageResponse(
          Array.isArray(response) ? response : [response],
          options
        )
      )
      .catch((e) => {});
  } catch (e) {
    useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
    ToastManager.show({
      heading: (e as Error).message,
      type: "error",
      context: "global"
    });
  }
};

const pick = async (options: PickerOptions) => {
  if (!PremiumService.get()) {
    const user = await db.user.getUser();
    if (!user) {
      ToastManager.show({
        heading: strings.loginRequired(),
        type: "error"
      });
      return;
    }
    if (editorState().isFocused) {
      editorState().isFocused = true;
    }
    if (user && !PremiumService.get() && !user?.isEmailConfirmed) {
      PremiumService.showVerifyEmailDialog();
    } else {
      PremiumService.sheet();
    }
    return;
  }
  useUserStore.getState().setDisableAppLockRequests(true);
  if (options?.type.startsWith("image") || options?.type === "camera") {
    if (options.type.startsWith("image")) {
      gallery(options);
    } else {
      camera(options);
    }
  } else {
    file(options);
  }
};

const handleImageResponse = async (
  response: Image[],
  options: PickerOptions
) => {
  const result = await AttachImage.present(response, options.context);

  if (!result) return;
  const compress = result.compress;

  for (const image of response) {
    const isPng = /(png)/g.test(image.mime);
    const isJpeg = /(jpeg|jpg)/g.test(image.mime);

    if (compress && (isPng || isJpeg)) {
      image.path = await compressToFile(
        Platform.OS === "ios" ? "file://" + image.path : image.path,
        isPng ? "PNG" : "JPEG"
      );

      const stat = await RNFetchBlob.fs.stat(image.path.replace("file://", ""));
      image.size = stat.size;
      image.path =
        Platform.OS === "ios" ? image.path.replace("file://", "") : image.path;
    }

    if (image.size > IMAGE_SIZE_LIMIT) {
      ToastManager.show({
        heading: strings.fileTooLarge(),
        message: strings.fileTooLargeDesc(50),
        type: "error"
      });
      return;
    }
    const b64 = `data:${image.mime};base64, ` + image.data;
    const uri = decodeURI(image.path);
    const hash = await Sodium.hashFile({
      uri: uri,
      type: "url"
    });

    let fileName = image.sourceURL
      ? basename(image.sourceURL)
      : image.filename || "image";

    fileName =
      image.mime === "image/jpeg"
        ? fileName.replace(/HEIC|HEIF/, "jpeg")
        : fileName;

    if (!(await attachFile(uri, hash, image.mime, fileName, options))) return;

    if (Platform.OS === "ios") await RNFetchBlob.fs.unlink(uri);

    if (
      options.tabId !== undefined &&
      useTabStore.getState().getNoteIdForTab(options.tabId) === options.noteId
    ) {
      editorController.current?.commands.insertImage(
        {
          hash: hash,
          mime: image.mime,
          type: "image",
          dataurl: b64,
          size: image.size,
          filename: fileName as string,
          width: image.width,
          height: image.height
        },
        options.tabId
      );
    }
  }
};

/**
 *
 * @param {string} uri
 * @param {string} hash
 * @param {string} type
 * @param {string} filename
 * @param {ImagePickerOptions} options
 * @returns
 */
export async function attachFile(
  uri: string,
  hash: string,
  type: string,
  filename: string,
  options: PickerOptions
) {
  try {
    const exists = await db.attachments.exists(hash);
    let encryptionInfo: any;
    if (options?.hash && options.hash !== hash) {
      ToastManager.show({
        heading: strings.fileMismatch(),
        type: "error",
        context: "local"
      });
      return false;
    }

    if (!options.reupload && exists) {
      options.reupload = (await filesystem.getUploadedFileSize(hash)) === 0;
    }

    if (options.reupload) {
      DatabaseLogger.log(`Deleting file before reupload. ${hash}`);
      const deleted = await db.fs().deleteFile(hash, false);
      if (!deleted)
        throw new Error(`Failed to delete file before reupload. ${hash}`);
    }

    if (!exists || options?.reupload) {
      const key = await db.attachments.generateKey();
      encryptionInfo = await Sodium.encryptFile(key, {
        uri: uri,
        type: options.outputType || "url",
        hash: hash
      } as any);
      encryptionInfo.mimeType = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = "xcha-stream";
      encryptionInfo.key = key;
      if (options?.reupload && exists) {
        const attachment = await db.attachments.attachment(hash);
        if (attachment) await db.attachments.reset(attachment?.id);
      }
    } else {
      encryptionInfo = { hash: hash };
    }

    await db.attachments.add(encryptionInfo);
    return true;
  } catch (e) {
    DatabaseLogger.error(e);
    if (Platform.OS === "ios") {
      await RNFetchBlob.fs.unlink(uri);
    }
    return false;
  }
}

export default {
  file,
  pick
};
