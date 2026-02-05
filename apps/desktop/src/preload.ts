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

/*
ABOUTME: Switched from direct `globalThis` assignment to `contextBridge.exposeInMainWorld`
to support Electron's Context Isolation (security best practice), which is enabled in `window-manager.ts`.

- Added `electronFS` for secure file writing capability from renderer.
- Added `appEvents` for handling external file drops.
*/

/* eslint-disable no-var */

import { ELECTRON_TRPC_CHANNEL } from "electron-trpc/main";
// import type { NNCrypto } from "@notesnook/crypto";
import { ipcRenderer } from "electron";
import { platform } from "os";
import { createWriteStream, mkdirSync } from "fs";
import { dirname } from "path";
import { Writable } from "stream";

declare global {
  var os: () => "mas" | ReturnType<typeof platform>;
  var electronTRPC: any;

  // file system stream writer for renderer to support secure file writes
  var electronFS: {
    createWritableStream: (
      path: string
    ) => Promise<WritableStreamDefaultWriter<any>>;
  };
  // var NativeNNCrypto: (new () => NNCrypto) | undefined;

  // listener for external file drops to support drag-and-drop features
  var appEvents: {
    onExternalDrop: (callback: (payload: any) => void) => void;
  };
}

process.once("loaded", async () => {
  const electronTRPC = {
    sendMessage: (operation: any) =>
      ipcRenderer.send(ELECTRON_TRPC_CHANNEL, operation),
    onMessage: (callback: any) =>
      ipcRenderer.on(ELECTRON_TRPC_CHANNEL, (_event, args) => callback(args))
  };

  globalThis.electronTRPC = electronTRPC;

  globalThis.appEvents = {
    onExternalDrop: (callback: any) => {
      const subscription = (_event: any, args: any) => callback(args);
      ipcRenderer.on("app:external-drop", subscription);
      return () =>
        ipcRenderer.removeListener("app:external-drop", subscription);
    }
  };

  globalThis.electronFS = {
    createWritableStream: async (path: string) => {
      mkdirSync(dirname(path), { recursive: true });
      return new WritableStream(
        Writable.toWeb(
          createWriteStream(path, { encoding: "utf-8" })
        ).getWriter()
      );
    }
  };

  globalThis.os = () => (MAC_APP_STORE ? "mas" : platform());
});
