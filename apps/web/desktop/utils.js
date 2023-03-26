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

import { app } from "electron";
import { join } from "path";
import { statSync, existsSync } from "fs";

const APP_ICON_PATH = join(
  __dirname,
  process.platform === "win32" ? "app.ico" : "favicon-72x72.png"
);

function isDevelopment() {
  if (typeof electron === "string") {
    throw new TypeError("Not running in an Electron environment!");
  }

  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
}

function getPath(filePath) {
  try {
    const result = statSync(filePath);

    if (result.isFile()) {
      return filePath;
    }

    if (result.isDirectory()) {
      return getPath(join(filePath, "index.html"));
    }
  } catch (_) {
    // ignore
  }
}

function isFlatpak() {
  return existsSync("/.flatpak-info");
}

export { getPath, isDevelopment, isFlatpak, APP_ICON_PATH };
