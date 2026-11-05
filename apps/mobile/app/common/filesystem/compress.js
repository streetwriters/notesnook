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
import { Dimensions, Image, Platform } from "react-native";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import RNFetchBlob from "react-native-blob-util";

/**
 * Scale down & compress images to screen width
 * for loading in editor.
 * @returns
 */
export async function compressToBase64(path, type) {
  const { width: screenWidth, scale } = Dimensions.get("window");

  return new Promise((resolve) => {
    Image.getSize(path, async (width) => {
      const response = await ImageResizer.createResizedImage(
        path,
        screenWidth * scale,
        99999,
        type,
        width <= 1920 ? 100 : 90,
        0,
        undefined,
        true,
        {
          mode: "contain",
          onlyScaleDown: true
        }
      );

      const base64 = await RNFetchBlob.fs.readFile(
        Platform.OS === "ios"
          ? response.uri?.replace("file://", "")
          : response.uri,
        "base64"
      );
      RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(() => {
        /* empty */
      });
      RNFetchBlob.fs.unlink(response.uri.replace("file://", "")).catch(() => {
        /* empty */
      });

      resolve(base64);
    });
  });
}

/**
 * @typedef {{ uri: string; size: number; original?: boolean }} CompressedImageResult
 * `original` is set when compression did not make the image smaller and the
 * original file was kept.
 */

/**
 * Get the compression type for a mime type or file path.
 * @param {string | undefined} mimeOrPath
 * @returns {"PNG" | "JPEG" | undefined}
 */
export function getCompressionType(mimeOrPath) {
  if (!mimeOrPath) return undefined;
  if (/png/i.test(mimeOrPath)) return "PNG";
  if (/jpe?g/i.test(mimeOrPath)) return "JPEG";
  return undefined;
}

/**
 * @param {string} path file:// prefixed path
 * @param {"PNG" | "JPEG"} type
 */
export async function compressImage(path, type) {
  const response = await ImageResizer.createResizedImage(
    path,
    1920,
    99999,
    type,
    80,
    0,
    undefined,
    true,
    {
      mode: "contain",
      onlyScaleDown: true
    }
  );
  return response;
}

export async function compressToFile(path, type) {
  const response = await compressImage(path, type);
  RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(() => {
    /* empty */
  });
  return response.uri;
}

/**
 * Get the final compressed image for a file, reusing a pre-compressed result
 * if there is one. The original file is deleted unless it is kept because
 * compression did not make it smaller.
 * @param {string} path file:// prefixed path of the original image
 * @param {"PNG" | "JPEG"} type
 * @param {CompressedImageResult} [preCompressed]
 * @param {number} [originalSize] size of the original, read from disk if not given
 * @returns {Promise<CompressedImageResult>}
 */
export async function resolveCompressedImage(
  path,
  type,
  preCompressed,
  originalSize
) {
  if (preCompressed) {
    if (!preCompressed.original) {
      RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(() => {
        /* empty */
      });
    }
    return preCompressed;
  }

  const res = await compressImage(path, type);
  let size = originalSize;
  if (!size) {
    try {
      size = (await RNFetchBlob.fs.stat(path.replace("file://", ""))).size;
    } catch (e) {
      /* empty */
    }
  }

  if (size && res.size >= size) {
    RNFetchBlob.fs.unlink(res.uri.replace("file://", "")).catch(() => {
      /* empty */
    });
    return { uri: path, size, original: true };
  }

  RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(() => {
    /* empty */
  });
  return { uri: res.uri, size: res.size };
}
