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

import { createTRPCProxyClient } from "@trpc/client";
import { ipcLink } from "electron-trpc/renderer";
import { AppRouter, createRPCServer, IClient } from "@notesnook/desktop";
import "@notesnook/desktop/dist/rpc/browser";

export const desktop = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()]
});

const client: IClient = {
  onCheckingForUpdate: function (): void {
    throw new Error("Function not implemented.");
  },
  onUpdateAvailable() {},
  onUpdateDownloadProgress() {},
  onUpdateDownloadCompleted() {},
  onUpdateNotAvailable() {},
  onThemeChanged: function (theme: "system" | "light" | "dark"): void {
    throw new Error("Function not implemented.");
  },
  onNotificationClicked: function (tag: string): void {
    throw new Error("Function not implemented.");
  },
  onCreateItem: function (type: "note" | "notebook" | "reminder") {
    console.log("GOT", type);
    return type;
  }
};

createRPCServer(window.RPCTransport, client);
