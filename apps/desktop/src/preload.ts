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
/* eslint-disable no-var */

import { ELECTRON_TRPC_CHANNEL } from "electron-trpc/main";
// import type { NNCrypto } from "@notesnook/crypto";
import { ipcRenderer } from "electron";
import { platform } from "os";

declare global {
  var os: () => "mas" | ReturnType<typeof platform>;
  var electronTRPC: any;
  // var NativeNNCrypto: (new () => NNCrypto) | undefined;
}

process.once("loaded", async () => {
  const electronTRPC = {
    sendMessage: (operation: any) =>
      ipcRenderer.send(ELECTRON_TRPC_CHANNEL, operation),
    onMessage: (callback: any) =>
      ipcRenderer.on(ELECTRON_TRPC_CHANNEL, (_event, args) => callback(args))
  };
  globalThis.electronTRPC = electronTRPC;
});

// globalThis.NativeNNCrypto = require("@notesnook/crypto").NNCrypto;
globalThis.os = () => (MAC_APP_STORE ? "mas" : platform());
