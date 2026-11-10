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

import fs, { paths } from "@react-native-gpui/fs";
import {
  SaveFormat,
  manipulateAsync
} from "@react-native-gpui/image-manipulator";
import { getFontConfig } from "@notesnook/theme";
import { compile, print, TypstError } from "@react-native-gpui/typst";
import { noteToTypst } from "../../../app/print";
import type { ImageData, ImageRequest } from "../../../app/print";

const GENERIC_FONTS = new Set([
  "sans-serif",
  "serif",
  "monospace",
  "-apple-system",
  "blinkmacsystemfont"
]);

function families(stack: string): string[] {
  return stack
    .split(",")
    .map((name) => name.trim().replace(/^["']|["']$/g, ""))
    .filter((name) => name && !GENERIC_FONTS.has(name.toLowerCase()));
}

const { body, monospace } = getFontConfig().fonts;
const BODY_FONTS = families(body);
const MONO_FONTS = families(monospace);

const APP_FONTS = [
  "Regular",
  "Bold",
  "Italic",
  "BoldItalic",
  "Medium",
  "SemiBold"
].map((style) => ({ path: `file://assets/fonts/Inter-${style}.ttf` }));

const TIMEOUT_MS = 120_000;

function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/\s+/g, "");
  const table = new Uint8Array(256).fill(255);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (let i = 0; i < alphabet.length; i++) table[alphabet.charCodeAt(i)] = i;
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let length = 0;
  let bits = 0;
  let value = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = table[clean.charCodeAt(i)];
    if (code === 255) continue;
    value = (value << 6) | code;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[length++] = (value >> bits) & 0xff;
    }
  }
  return out.subarray(0, length);
}

function toBase64(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += alphabet[(n >> 18) & 63] + alphabet[(n >> 12) & 63];
    out += i + 1 < bytes.length ? alphabet[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? alphabet[n & 63] : "=";
  }
  return out;
}

function sizeOf(bytes: Uint8Array, mime: string) {
  if (mime === "image/png" && bytes.length > 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (mime === "image/jpeg") {
    let at = 2;
    while (at + 9 < bytes.length) {
      if (bytes[at] !== 0xff) break;
      const marker = bytes[at + 1];
      const length = (bytes[at + 2] << 8) | bytes[at + 3];
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          height: (bytes[at + 5] << 8) | bytes[at + 6],
          width: (bytes[at + 7] << 8) | bytes[at + 8]
        };
      }
      at += 2 + length;
    }
  }
  return {};
}

async function resolveImage(request: ImageRequest): Promise<ImageData | null> {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(request.src ?? "");
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const bytes = match[2]
    ? fromBase64(match[3])
    : new TextEncoder().encode(decodeURIComponent(match[3]));
  return { bytes, mime, ...sizeOf(bytes, mime) };
}

async function prepareImage(
  image: ImageData,
  target: { maxWidth: number }
): Promise<ImageData> {
  const keepPng =
    image.mime === "image/png" ||
    image.mime === "image/gif" ||
    image.mime === "image/webp";
  const result = await manipulateAsync(
    `data:${image.mime};base64,${toBase64(image.bytes)}`,
    [{ resize: { width: target.maxWidth } }],
    {
      format: keepPng ? SaveFormat.PNG : SaveFormat.JPEG,
      compress: 0.85,
      base64: true
    }
  );
  if (!result.base64) return image;
  return {
    bytes: fromBase64(result.base64),
    mime: keepPng ? "image/png" : "image/jpeg",
    width: result.width,
    height: result.height
  };
}

async function build(title: string, html: string, math: "convert" | "raw") {
  return noteToTypst(html, {
    title: title || undefined,
    bodyFonts: BODY_FONTS,
    monoFonts: MONO_FONTS,
    math,
    resolveImage,
    prepareImage
  });
}

export async function htmlToPdf(
  title: string,
  html: string
): Promise<Uint8Array> {
  let math: "convert" | "raw" = "convert";
  for (;;) {
    const note = await build(title, html, math);
    try {
      const result = await compile(note.source, {
        files: note.files,
        fonts: APP_FONTS,
        title: title || undefined,
        systemFonts: "fallback",
        timeoutMs: TIMEOUT_MS
      });
      return new Uint8Array(result.pdf!);
    } catch (error) {
      if (
        math === "convert" &&
        error instanceof TypstError &&
        error.code === "ERR_TYPST"
      ) {
        math = "raw";
        continue;
      }
      throw error;
    }
  }
}

export async function printPdf(
  title: string,
  pdf: Uint8Array,
  outputPath?: string
): Promise<boolean> {
  const path = `${paths.temp}/print-${Date.now()}.pdf`;
  await fs.promises.writeFile(path, pdf);
  try {
    const result = await print(path, {
      title: title || undefined,
      panel: !outputPath,
      outputPath
    });
    return result.status === "printed";
  } finally {
    fs.promises.rm(path, { force: true }).catch(() => {});
  }
}
