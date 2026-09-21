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

export async function getFileNameWithExtension(
  filename: string,
  mime: string | undefined
): Promise<string> {
  if (!mime || mime === "application/octet-stream") return filename;

  const { default: mimeDB } = await import("mime-db");

  const { extensions } = mimeDB[mime] || {};

  if (!extensions || extensions.length === 0) return filename;

  for (const ext of extensions) {
    if (filename.endsWith(ext)) return filename;
  }

  const extension = extensions.values().next().value;
  return `${filename}.${extension}`;
}

export const PDFMimeType = "application/pdf";
export const DocumentMimeTypes = [
  PDFMimeType,
  "application/msword",
  "application/vnd.ms-word",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml",
  "application/vnd.oasis.opendocument.presentation"
];

export function isDocument(mime: string) {
  return DocumentMimeTypes.some((a) => a.startsWith(mime));
}

export const WebClipMimeType = "application/vnd.notesnook.web-clip";
export function isWebClip(mime: string) {
  return mime === WebClipMimeType;
}

export function isImage(mime: string) {
  return mime.startsWith("image/");
}

/**
 * A static map of common image file extensions to their MIME types.
 * This is used as a fallback when the MIME type reported by the
 * platform is missing or generic (e.g. `application/octet-stream`),
 * which is common for WebP and some other formats on mobile
 * document pickers and browser paste operations.
 *
 * Kept intentionally small — only formats the editor/renderer can
 * actually display.  Raw formats (CR2, NEF, …) are intentionally
 * excluded because they must be treated as file attachments.
 */
const IMAGE_EXTENSION_MIME: Readonly<Record<string, string>> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
  tif: "image/tiff",
  tiff: "image/tiff"
};

/**
 * Infer the image MIME type from a filename's extension.
 * Returns `undefined` when the extension is not a recognised image
 * format.
 */
export function getImageMimeTypeFromFilename(
  filename: string | undefined
): string | undefined {
  if (!filename) return undefined;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  return IMAGE_EXTENSION_MIME[ext];
}

/**
 * Determine whether a file is an image, looking at both the MIME
 * type *and* the file extension.
 *
 * The MIME type is authoritative when it starts with `image/`.
 * When the MIME type is missing, empty, or the generic
 * `application/octet-stream` (which browsers and mobile document
 * pickers frequently report for WebP and other formats) the
 * decision falls back to the file extension via
 * {@link getImageMimeTypeFromFilename}.
 */
export function isImageFile(
  filename: string | undefined,
  mime: string | undefined
): boolean {
  if (mime && mime.startsWith("image/")) return true;
  if (!mime || mime === "" || mime === "application/octet-stream") {
    return getImageMimeTypeFromFilename(filename) !== undefined;
  }
  return false;
}

export function isVideo(mime: string) {
  return mime.startsWith("video/");
}

export function isAudio(mime: string) {
  return mime.startsWith("audio/");
}
