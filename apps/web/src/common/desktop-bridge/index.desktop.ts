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
import type { AppRouter } from "@notesnook/desktop";
import { AppEventManager, AppEvents } from "../app-events";
import { TaskScheduler } from "../../utils/task-scheduler";
import { checkForUpdate } from "../../utils/updater";
import { store as settingStore } from "../../stores/setting-store";

export const desktop: ReturnType<typeof createTRPCProxyClient<AppRouter>> =
  createTRPCProxyClient<AppRouter>({
    links: [ipcLink()]
  });

attachListeners();
function attachListeners() {
  console.log("attaching listeners");

  desktop.updater.onChecking.subscribe(
    undefined,
    attachListener(AppEvents.checkingForUpdate)
  );

  desktop.updater.onAvailable.subscribe(
    undefined,
    attachListener(AppEvents.updateAvailable)
  );

  desktop.updater.onDownloaded.subscribe(
    undefined,
    attachListener(AppEvents.updateDownloadCompleted)
  );

  desktop.updater.onDownloadProgress.subscribe(
    undefined,
    attachListener(AppEvents.updateDownloadProgress)
  );

  desktop.updater.onNotAvailable.subscribe(
    undefined,
    attachListener(AppEvents.updateNotAvailable)
  );

  desktop.updater.onError.subscribe(
    undefined,
    attachListener(AppEvents.updateError)
  );

  TaskScheduler.register("updateCheck", "0 0 */12 * * * *", () => {
    checkForUpdate(settingStore.get().autoUpdates);
  });
}

function attachListener(event: string) {
  return {
    onData(...args: any[]) {
      console.log("Received data:", args);
      AppEventManager.publish(event, ...args);
    }
  };
}

export async function createWritableStream(path: string) {
  const id = await desktop.backups.open.mutate({ filename: path });
  return new WritableStream<Uint8Array>({
    write(chunk) {
      return desktop.backups.write.mutate({
        id,
        chunk: Buffer.from(chunk).toString("base64")
      });
    },
    close() {
      return desktop.backups.close.mutate({ id });
    },
    abort() {
      return desktop.backups.close.mutate({ id });
    }
  });
}
