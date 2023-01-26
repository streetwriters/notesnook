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
import { EVENTS } from "./events";
import bringToFront from "./ipc/actions/bringToFront";
import { sendMessageToRenderer } from "./ipc/utils";
import { APP_ICON_PATH } from "./utils";

export function setupTray() {
  const tray = new Tray(APP_ICON_PATH);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Notesnook",
      type: "normal",
      icon: APP_ICON_PATH,
      click: bringToFront
    },
    { type: "separator" },
    {
      label: "New note",
      type: "normal",
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "note" });
      }
    },
    {
      label: "New notebook",
      type: "normal",
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "notebook" });
      }
    },
    { type: "separator" },
    {
      label: "Quit Notesnook",
      type: "normal",
      click: () => {
        app.exit(0);
      }
    }
  ]);
  tray.on("double-click", bringToFront);
  tray.on("click", bringToFront);
  tray.setToolTip("Notesnook");
  tray.setContextMenu(contextMenu);
}
