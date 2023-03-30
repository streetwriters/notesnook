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

import { initTRPC } from "@trpc/server";
import { CancellationToken, autoUpdater } from "electron-updater";

const t = initTRPC.create();

export const updaterRouter = t.router({
  install: t.procedure.query(() => autoUpdater.quitAndInstall()),
  download: t.procedure.query(async () => {
    const cancellationToken = new CancellationToken();
    await autoUpdater.downloadUpdate(cancellationToken);
  }),
  check: t.procedure.query(async () => {
    await autoUpdater.checkForUpdates();
  })
});
