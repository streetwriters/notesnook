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

export interface ImageData {
  bytes: Uint8Array;
  mime: string;
  width?: number;
  height?: number;
}

export interface ImageRequest {
  src?: string;
  hash?: string;
  alt?: string;
}

export interface PrintDocumentOptions {
  title?: string;
  paper?: "a4" | "us-letter" | "a3" | "a5" | "us-legal";
  margin?: string;
  fontSize?: number;
  bodyFonts?: string[];
  monoFont?: string;
  direction?: "ltr" | "rtl";
  dpi?: number;
  math?: "convert" | "raw";
  resolveImage?: (request: ImageRequest) => Promise<ImageData | null>;
  prepareImage?: (
    image: ImageData,
    target: { maxWidth: number }
  ) => Promise<ImageData>;
  describeAttachment?: (hash: string) => { name: string; size?: number } | undefined;
}

export interface ConvertedNote {
  source: string;
  files: Record<string, Uint8Array>;
  warnings: string[];
}

export class ConvertError extends Error {
  constructor(
    readonly code: "too-large" | "html",
    message: string
  ) {
    super(message);
    this.name = "ConvertError";
  }
}

export const LIMITS = {
  maxSourceBytes: 7 * 1024 * 1024,
  maxImages: 1900,
  maxImageBytes: 25 * 1024 * 1024,
  maxTotalImageBytes: 200 * 1024 * 1024
} as const;
