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

import { nativeTheme } from "electron";
import path from "path";
import { isDevelopment } from "./utils";

type Icons = "note-add" | "notebook-add" | "reminder-add" | "quit";
const APP_DIR = isDevelopment()
  ? process.cwd()
  : path.dirname(process.execPath);
export class AssetManager {
  static appIcon(options: {
    size?: 16 | 24 | 32 | 48 | 64 | 128 | 256 | 512 | 1024;
    format?: "ico" | "png" | "icns";
  }) {
    const { size = 32, format } = options;

    if (format === "ico") return path.join("assets", "icons", "app.ico");
    if (format === "icns") return path.join("assets", "icons", "app.icns");

    return path.join("assets", "icons", `${size}x${size}.png`);
  }

  static icon(name: Icons, format: "png" | "ico" = "png") {
    const prefix = nativeTheme.shouldUseDarkColors ? ".dark" : "";
    return path.join(APP_DIR, "assets", "icons", `${name}${prefix}.${format}`);
  }
}
