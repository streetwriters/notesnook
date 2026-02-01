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
  var electronFS: {
    createWritableStream: (
      path: string
    ) => Promise<WritableStreamDefaultWriter<any>>;
  };
  // var NativeNNCrypto: (new () => NNCrypto) | undefined;
  var appEvents: {
    onExternalDrop: (callback: (payload: any) => void) => void;
  };
}

import { contextBridge } from "electron";
import { createWriteStream, mkdirSync } from "fs";
import { dirname } from "path";
import { Writable } from "stream";

process.once("loaded", async () => {
  const electronTRPC = {
    sendMessage: (operation: any) =>
      ipcRenderer.send(ELECTRON_TRPC_CHANNEL, operation),
    onMessage: (callback: any) =>
      ipcRenderer.on(ELECTRON_TRPC_CHANNEL, (_event, args) => callback(args))
  };

  contextBridge.exposeInMainWorld("electronTRPC", electronTRPC);

  contextBridge.exposeInMainWorld("appEvents", {
    onExternalDrop: (callback: any) => {
      const subscription = (_event: any, args: any) => callback(args);
      ipcRenderer.on("app:external-drop", subscription);
      return () =>
        ipcRenderer.removeListener("app:external-drop", subscription);
    }
  });

  contextBridge.exposeInMainWorld("electronFS", {
    createWritableStream: async (path: string) => {
      mkdirSync(dirname(path), { recursive: true });
      return new WritableStream(
        Writable.toWeb(
          createWriteStream(path, { encoding: "utf-8" })
        ).getWriter()
      );
    }
  });

  contextBridge.exposeInMainWorld("os", () =>
    MAC_APP_STORE ? "mas" : platform()
  );
});
