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
import { type RendererGlobalElectronTRPC } from "electron-trpc/src/types";
import { NNCrypto } from "@notesnook/crypto";
import { ipcRenderer } from "electron";
import { CHANNEL, ITransport } from "./rpc";

declare global {
  var os: string;
  var electronTRPC: RendererGlobalElectronTRPC;
  var RPCTransport: ITransport;
  var NativeNNCrypto: new () => NNCrypto;
}

process.once("loaded", async () => {
  const electronTRPC: RendererGlobalElectronTRPC = {
    sendMessage: (operation) =>
      ipcRenderer.send(ELECTRON_TRPC_CHANNEL, operation),
    onMessage: (callback) =>
      ipcRenderer.on(ELECTRON_TRPC_CHANNEL, (_event, args) => callback(args))
  };
  globalThis.electronTRPC = electronTRPC;

  globalThis.RPCTransport = {
    send(message) {
      console.log("[browser] sending message", message);
      ipcRenderer.send(CHANNEL, message);
    },
    receive(callback) {
      ipcRenderer.removeAllListeners(CHANNEL);
      ipcRenderer.addListener(CHANNEL, (_event, args) => {
        console.log("[browser] recevied message", args);
        callback(args);
      });
    }
  };
});

globalThis.NativeNNCrypto = NNCrypto;
globalThis.os = MAC_APP_STORE ? "mas" : process.platform;
