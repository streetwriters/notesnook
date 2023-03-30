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

import { ipcMain } from "electron";
import { CHANNEL, createRPCClient } from ".";
import { ClientPrototype, ITransport } from "./types";

const transport: ITransport = {
  send(message) {
    console.log("[electron] sending message", message);
    globalThis.window?.webContents.send(CHANNEL, message);
  },
  receive(callback) {
    ipcMain.on(CHANNEL, (_event, message) => {
      console.log("[electron] received message", message);
      callback(message);
    });
  }
};

export const client = createRPCClient(transport, ClientPrototype);
