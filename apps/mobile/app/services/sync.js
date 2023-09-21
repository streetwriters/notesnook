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

import NetInfo from "@react-native-community/netinfo";
import { db } from "../common/database";
import { DatabaseLogger } from "../common/database/index";
import { initAfterSync } from "../stores/index";
import { SyncStatus, useUserStore } from "../stores/use-user-store";
import BackgroundSync from "./background-sync";
import { ToastEvent } from "./event-manager";
import SettingsService from "./settings";

export const ignoredMessages = [
  "Sync already running",
  "Not allowed to start service intent",
  "WebSocket failed to connect",
  "Failed to start the HttpConnection before"
];
let pendingSync = undefined;
let syncTimer = 0;
const run = async (
  context = "global",
  forced = false,
  full = true,
  onCompleted,
  lastSyncTime
) => {
  if (useUserStore.getState().syncing) {
    DatabaseLogger.info("Sync in progress");
    pendingSync = {
      full: full
    };
    return;
  }

  if (pendingSync) {
    pendingSync = undefined;
    DatabaseLogger.info("Running pending sync...");
  }

  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const status = await NetInfo.fetch();
    const userstore = useUserStore.getState();
    const user = await db.user.getUser();
    if (!status.isInternetReachable) {
      DatabaseLogger.warn("Internet not reachable");
    }

    if (
      !user ||
      !status.isInternetReachable ||
      SettingsService.get().disableSync
    ) {
      initAfterSync();
      pendingSync = undefined;
      return onCompleted?.(false);
    }
    userstore.setSyncing(true);

    let error = null;

    try {
      await BackgroundSync.doInBackground(async () => {
        try {
          await db.sync(full, forced, lastSyncTime);
        } catch (e) {
          error = e;
        }
      });

      if (error) {
        throw error;
      }
    } catch (e) {
      error = e;
      if (
        !ignoredMessages.find((message) => e.message?.includes(message)) &&
        userstore.user &&
        status.isConnected &&
        status.isInternetReachable
      ) {
        ToastEvent.error(e, "Sync failed", context);
      }

      DatabaseLogger.error(e, "[Client] Failed to sync");
    } finally {
      initAfterSync();
      userstore.setSyncing(
        false,
        error ? SyncStatus.Failed : SyncStatus.Passed
      );
      onCompleted?.(error ? SyncStatus.Failed : SyncStatus.Passed);
      setImmediate(() => {
        if (pendingSync) Sync.run("global", false, pendingSync.full);
      });
    }
  }, 300);
};

const Sync = {
  run
};

export default Sync;
