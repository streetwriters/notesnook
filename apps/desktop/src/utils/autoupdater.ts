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

import { autoUpdater } from "electron-updater";
import { client } from "../rpc/electron";

async function configureAutoUpdater() {
  autoUpdater.setFeedURL({
    provider: "generic",
    url: `https://notesnook.com/releases/${process.platform}/`,
    useMultipleRangeRequest: false
  });

  autoUpdater.autoDownload = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.addListener("checking-for-update", client.onCheckingForUpdate);
  autoUpdater.addListener("update-available", client.onUpdateAvailable);
  autoUpdater.addListener("download-progress", client.onUpdateDownloadProgress);
  autoUpdater.addListener(
    "update-downloaded",
    client.onUpdateDownloadCompleted
  );
  autoUpdater.addListener("update-not-available", client.onUpdateNotAvailable);
}

export { configureAutoUpdater };
