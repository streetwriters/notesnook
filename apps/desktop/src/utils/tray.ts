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

import { app, Menu, Tray } from "electron";
import { AssetManager } from "./asset-manager";
import { isFlatpak } from "./index";
import { bringToFront } from "./bring-to-front";
import { client } from "../rpc/electron";

let tray: Tray | undefined = undefined;
export function destroyTray() {
  if (tray) tray.destroy();
}

export function setupTray() {
  if (tray) tray.destroy();

  const trayIconSize =
    process.platform === "win32" || process.platform === "darwin" ? 16 : 32;

  tray = new Tray(
    AssetManager.icon("tray-icon", {
      size: process.platform === "darwin" ? 22 : 32
    })
  );

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show app",
      type: "normal",
      icon: isFlatpak()
        ? undefined
        : AssetManager.icon("tray-icon", { size: trayIconSize }),
      click: bringToFront
    },
    { type: "separator" },
    {
      label: "New note",
      type: "normal",
      icon: isFlatpak()
        ? undefined
        : AssetManager.icon("note-add", { size: trayIconSize }),
      click: () => {
        bringToFront();
        client.onCreateItem("note");
      }
    },
    {
      label: "New notebook",
      type: "normal",
      icon: isFlatpak()
        ? undefined
        : AssetManager.icon("notebook-add", { size: trayIconSize }),
      click: () => {
        bringToFront();
        client.onCreateItem("notebook");
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      icon: isFlatpak()
        ? undefined
        : AssetManager.icon("quit", { size: trayIconSize }),
      type: "normal",
      click: () => {
        app.exit(0);
      }
    }
  ]);
  tray.on("double-click", bringToFront);
  if (process.platform !== "darwin") tray.on("click", bringToFront);
  tray.setToolTip("Notesnook");
  tray.setContextMenu(contextMenu);
}
