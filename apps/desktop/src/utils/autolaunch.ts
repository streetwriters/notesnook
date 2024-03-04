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
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import path from "path";

const LINUX_DESKTOP_ENTRY = (hidden: boolean) => `[Desktop Entry]
Type=Application
Version=${app.getVersion()}
Name=${app.getName()}
Comment=${app.getName()} startup script
Exec=${
  process.env.APPIMAGE
    ? `${process.env.APPIMAGE}${hidden ? " --hidden" : ""}`
    : `${process.execPath}${hidden ? " --hidden" : ""}`
}
StartupNotify=false
Terminal=false`;

const LINUX_AUTOSTART_DIRECTORY_PATH = path.join(
  app.getPath("home"),
  ".config",
  "autostart"
);

const STARTUP_ARGS = ["--hidden"];

export class AutoLaunch {
  static enable(hidden: boolean) {
    if (process.platform === "linux") {
      mkdirSync(LINUX_AUTOSTART_DIRECTORY_PATH, { recursive: true });
      writeFileSync(
        path.join(
          LINUX_AUTOSTART_DIRECTORY_PATH,
          `${app.getName().toLowerCase()}.desktop`
        ),
        LINUX_DESKTOP_ENTRY(hidden)
      );
    } else {
      const loginItemSettings = app.getLoginItemSettings({
        args: STARTUP_ARGS
      });
      if (loginItemSettings.openAtLogin) return;
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: hidden,
        args: STARTUP_ARGS
      });
    }
  }

  static disable() {
    if (process.platform === "linux") {
      const desktopFilePath = path.join(
        LINUX_AUTOSTART_DIRECTORY_PATH,
        `${app.getName().toLowerCase()}.desktop`
      );
      if (!existsSync(desktopFilePath)) return;
      rmSync(desktopFilePath);
    } else {
      app.setLoginItemSettings({ openAtLogin: false, openAsHidden: false });
    }
  }
}
