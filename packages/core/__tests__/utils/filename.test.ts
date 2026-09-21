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

import { describe, test, expect } from "vitest";
import {
  isImage,
  isImageFile,
  getImageMimeTypeFromFilename
} from "../../src/utils/filename.js";

describe("isImage", () => {
  test("returns true for any image/* MIME type", () => {
    expect(isImage("image/png")).toBe(true);
    expect(isImage("image/webp")).toBe(true);
    expect(isImage("image/gif")).toBe(true);
    expect(isImage("image/jpeg")).toBe(true);
    expect(isImage("image/svg+xml")).toBe(true);
  });

  test("returns false for non-image MIME types", () => {
    expect(isImage("application/pdf")).toBe(false);
    expect(isImage("audio/mpeg")).toBe(false);
    expect(isImage("video/mp4")).toBe(false);
    expect(isImage("application/octet-stream")).toBe(false);
  });
});

describe("getImageMimeTypeFromFilename", () => {
  test("maps common image extensions to MIME types", () => {
    expect(getImageMimeTypeFromFilename("photo.webp")).toBe("image/webp");
    expect(getImageMimeTypeFromFilename("photo.WEBP")).toBe("image/webp");
    expect(getImageMimeTypeFromFilename("icon.png")).toBe("image/png");
    expect(getImageMimeTypeFromFilename("img.JPG")).toBe("image/jpeg");
    expect(getImageMimeTypeFromFilename("scan.tiff")).toBe("image/tiff");
    expect(getImageMimeTypeFromFilename("anim.gif")).toBe("image/gif");
    expect(getImageMimeTypeFromFilename("logo.svg")).toBe("image/svg+xml");
  });

  test("returns undefined for non-image extensions", () => {
    expect(getImageMimeTypeFromFilename("doc.pdf")).toBeUndefined();
    expect(getImageMimeTypeFromFilename("song.mp3")).toBeUndefined();
    expect(getImageMimeTypeFromFilename("clip.mp4")).toBeUndefined();
    expect(getImageMimeTypeFromFilename("archive.zip")).toBeUndefined();
  });

  test("handles edge cases", () => {
    expect(getImageMimeTypeFromFilename("")).toBeUndefined();
    expect(getImageMimeTypeFromFilename("noext")).toBeUndefined();
    expect(getImageMimeTypeFromFilename(undefined)).toBeUndefined();
    expect(getImageMimeTypeFromFilename("path/to/file.webp")).toBe(
      "image/webp"
    );
    expect(getImageMimeTypeFromFilename("file.name.with.dots.png")).toBe(
      "image/png"
    );
  });
});

describe("isImageFile", () => {
  test("trusts a valid image MIME type regardless of extension", () => {
    expect(isImageFile("file.bin", "image/webp")).toBe(true);
    expect(isImageFile("file.dat", "image/png")).toBe(true);
    expect(isImageFile(undefined, "image/jpeg")).toBe(true);
  });

  test("rejects non-image MIME types even with an image extension", () => {
    expect(isImageFile("photo.png", "application/pdf")).toBe(false);
    expect(isImageFile("photo.png", "audio/mpeg")).toBe(false);
  });

  test("falls back to extension when MIME is missing", () => {
    expect(isImageFile("photo.webp", undefined)).toBe(true);
    expect(isImageFile("photo.webp", "")).toBe(true);
    expect(isImageFile("icon.png", undefined)).toBe(true);
    expect(isImageFile("img.jpg", undefined)).toBe(true);
  });

  test("falls back to extension when MIME is application/octet-stream", () => {
    expect(isImageFile("photo.webp", "application/octet-stream")).toBe(true);
    expect(isImageFile("icon.png", "application/octet-stream")).toBe(true);
  });

  test("returns false for non-image files with missing MIME", () => {
    expect(isImageFile("doc.pdf", undefined)).toBe(false);
    expect(isImageFile("song.mp3", "")).toBe(false);
    expect(isImageFile("archive.zip", "application/octet-stream")).toBe(false);
    expect(isImageFile(undefined, undefined)).toBe(false);
  });
});
