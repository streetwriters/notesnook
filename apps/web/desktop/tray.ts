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
import { EVENTS } from "./events";
import bringToFront from "./ipc/actions/bringToFront";
import { sendMessageToRenderer } from "./ipc/utils";

let tray: Tray | undefined = undefined;
export function setupTray() {
  if (tray) tray.destroy();

  tray = new Tray(AssetManager.appIcon({ size: process.platform === "darwin" ? 24 : 32 }));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show app",
      type: "normal",
      icon: AssetManager.appIcon({ size: 16 }),
      click: bringToFront
    },
    { type: "separator" },
    {
      label: "New note",
      type: "normal",
      icon: AssetManager.icon("note-add", { size: 16 }),
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "note" });
      }
    },
    {
      label: "New notebook",
      type: "normal",
      icon: AssetManager.icon("notebook-add", { size: 16 }),
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "notebook" });
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      icon: AssetManager.icon("quit", { size: 16 }),
      type: "normal",
      click: () => {
        app.exit(0);
      }
    }
  ]);
  tray.on("double-click", bringToFront);
  if (process.platform !==  "darwin") tray.on("click", bringToFront);
  tray.setToolTip("Notesnook");
  tray.setContextMenu(contextMenu);
}
