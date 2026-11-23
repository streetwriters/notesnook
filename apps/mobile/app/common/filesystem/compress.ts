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
import ImageResizer from "@bam.tech/react-native-image-resizer";
import RNFetchBlob from "react-native-blob-util";

/**
 * `original` is set when compression did not make the image smaller and the
 * original file was kept.
 */
export type CompressedImage = { uri: string; size: number; original?: boolean };

/**
 * Get the compression type for a mime type.
 */
export function getCompressionType(mime?: string): "PNG" | "JPEG" | undefined {
  if (!mime) return undefined;
  if (/png/i.test(mime)) return "PNG";
  if (/jpe?g/i.test(mime)) return "JPEG";
  return undefined;
}

/**
 * Delete a file, ignoring errors. Accepts file:// prefixed paths.
 */
export function unlinkFile(path: string) {
  RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(() => {
    /* empty */
  });
}

/**
 * Compress an image. If the result is not smaller than the original, the
 * result is deleted and the original is returned with `original: true`.
 * The original file is never deleted here; callers should delete it unless
 * `original` is set.
 * @param path file:// prefixed path
 * @param originalSize size of the original, read from disk if not given
 */
export async function compressImage(
  path: string,
  type: "PNG" | "JPEG",
  originalSize?: number
): Promise<CompressedImage> {
  const res = await ImageResizer.createResizedImage(
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

  let size = originalSize;
  if (!size) {
    try {
      size = (await RNFetchBlob.fs.stat(path.replace("file://", ""))).size;
    } catch (e) {
      /* empty */
    }
  }

  if (size && res.size >= size) {
    unlinkFile(res.uri);
    return { uri: path, size, original: true };
  }
  return { uri: res.uri, size: res.size };
}
