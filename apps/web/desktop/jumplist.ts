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

import { app, Menu } from "electron";
import { AssetManager } from "./asset-manager";
import { EVENTS } from "./events";
import bringToFront from "./ipc/actions/bringToFront";
import { sendMessageToRenderer } from "./ipc/utils";

export function setupJumplist() {
  if (process.platform === "win32") {
    setJumplistOnWindows();
  } else if (process.platform === "darwin") {
    setDockMenuOnMacOs();
  }
}

function setJumplistOnWindows() {
  app.setJumpList([
    {
      type: "custom",
      name: "Quick actions",
      items: [
        {
          program: process.execPath,
          iconIndex: 0,
          iconPath: AssetManager.icon("note-add", { format: "ico" }),
          args: "new note",
          description: "Create a new note",
          title: "New note",
          type: "task"
        },
        {
          program: process.execPath,
          iconIndex: 0,
          iconPath: AssetManager.icon("notebook-add", { format: "ico" }),
          args: "new notebook",
          description: "Create a new notebook",
          title: "New notebook",
          type: "task"
        },
        {
          program: process.execPath,
          iconIndex: 0,
          iconPath: AssetManager.icon("reminder-add", { format: "ico" }),
          args: "new reminder",
          description: "Add a new reminder",
          title: "New reminder",
          type: "task"
        }
      ]
    }
  ]);
}

function setDockMenuOnMacOs() {
  const contextMenu = Menu.buildFromTemplate([
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
    {
      label: "New reminder",
      type: "normal",
      click: () => {
        bringToFront();
        sendMessageToRenderer(EVENTS.createItem, { itemType: "reminder" });
      }
    }
  ]);
  app.dock.setMenu(contextMenu);
}
