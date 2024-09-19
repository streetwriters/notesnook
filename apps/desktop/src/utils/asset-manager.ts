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

import { NativeImage, nativeImage } from "electron";
import path from "path";
import { isDevelopment } from "./index";
import { ParsedImage, parseICO } from "icojs";
import { getSystemTheme } from "./theme";
import { readFile } from "fs/promises";

type Formats = "ico" | "png" | "icns";
type IconOptions<TFormat extends Formats> = {
  size?: 16 | 22 | 24 | 32 | 48 | 64 | 128 | 256 | 512 | 1024;
  format?: TFormat;
};

type IconNames = (typeof icons)[number];
type Prefixes = (typeof prefixes)[number];

type FlexibleIcon<TFormat extends Formats> = TFormat extends "ico"
  ? string
  : NativeImage;

const RESOURCES_DIR = isDevelopment()
  ? process.cwd()
  : process.platform === "darwin"
  ? path.normalize(path.join(path.dirname(process.execPath), "..", "Resources"))
  : path.join(path.dirname(process.execPath), "resources");

const prefixes = ["", ".dark"];
const icons = [
  "note-add",
  "notebook-add",
  "reminder-add",
  "quit",
  "tray-icon"
] as const;

const ALL_ICONS: {
  id: IconNames;
  prefix: Prefixes;
  images: ParsedImage[];
}[] = [];

export class AssetManager {
  static async loadIcons() {
    if (ALL_ICONS.length) return;

    for (const prefix of prefixes) {
      for (const icon of icons) {
        const icoPath = path.join(
          RESOURCES_DIR,
          "assets",
          "icons",
          `${icon}${prefix}.ico`
        );
        const icoBuffer = await readFile(icoPath);
        const images = await parseICO(icoBuffer, "image/png");
        ALL_ICONS.push({ id: icon, images, prefix });
      }
    }
  }

  static appIcon(options: IconOptions<Formats>) {
    const { size = 32, format = "png" } = options;

    if (format === "ico") return "assets\\icons\\app.ico";
    if (format === "icns") return "assets/icons/app.icns";

    return `assets/icons/${size}x${size}.png`;
  }

  static icon<TFormat extends Formats>(
    name: IconNames,
    options: IconOptions<TFormat>
  ): FlexibleIcon<TFormat> {
    const { size = 16, format = "png" } = options;

    const prefix: Prefixes = getSystemTheme() === "dark" ? ".dark" : "";

    const icoPath = path.join(
      RESOURCES_DIR,
      "assets",
      "icons",
      `${name}${prefix}.ico`
    );
    if (format === "ico") return icoPath as FlexibleIcon<TFormat>;

    const icon = ALL_ICONS.find((a) => a.id === name && a.prefix === prefix);
    if (!icon)
      return nativeImage.createFromPath(
        AssetManager.appIcon(options)
      ) as FlexibleIcon<TFormat>;

    return nativeImage.createFromBuffer(
      Buffer.from(
        (icon.images.find((i) => i.height === size) || icon.images[0]).buffer
      )
    ) as FlexibleIcon<TFormat>;
  }
}
