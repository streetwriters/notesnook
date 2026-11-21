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

import type { EditorCommand } from "../../controller.js";

/** What the image properties popup reads from the selected image. */
export type ImageDimensions = {
  width?: number;
  height?: number;
  aspectRatio?: number;
};

/**
 * A size request for the engine's `setImageSize`. A missing `height` lets the
 * engine keep the image's own ratio; `locked: false` stretches (both given).
 */
export type ImageSize = { width: number; height?: number; locked?: false };

/**
 * The image's width over its height: the stored `aspectRatio` when it has one
 * (Tiptap images do), else the current size (the native editor keeps only the
 * size). 0 when neither is known, which leaves the two fields independent.
 */
export function imageRatio(image: ImageDimensions): number {
  if (image.aspectRatio && image.aspectRatio > 0) return image.aspectRatio;
  if (image.width && image.height && image.width > 0 && image.height > 0)
    return image.width / image.height;
  return 0;
}

function valid(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * The size after typing a new width: the height follows `ratio` (the image's
 * own by default; the popup passes the one it captured when it opened, so
 * rounding while typing can't drift it). Without any ratio only the width is
 * set: the image keeps whatever shape it has instead of becoming a square.
 */
export function sizeForWidth(
  image: ImageDimensions,
  text: string,
  ratio: number = imageRatio(image)
): ImageSize | null {
  const width = Math.round(Number(text));
  if (!valid(width)) return null;
  return ratio ? { width, height: Math.round(width / ratio) } : { width };
}

/**
 * The size after typing a new height: the width follows `ratio`. Without one
 * the width stays as it is and the image stretches to the typed height.
 */
export function sizeForHeight(
  image: ImageDimensions,
  text: string,
  ratio: number = imageRatio(image)
): ImageSize | null {
  const height = Math.round(Number(text));
  if (!valid(height)) return null;
  if (ratio) return { width: Math.round(height * ratio), height };
  if (image.width && image.width > 0)
    return { width: image.width, height, locked: false };
  return null;
}

export function setImageSizeCommand(size: ImageSize): EditorCommand {
  return { name: "setImageSize", args: [size] };
}

export function setImageAlignmentCommand(
  align: "left" | "center" | "right"
): EditorCommand {
  return { name: "setImageAlignment", args: [{ align }] };
}
