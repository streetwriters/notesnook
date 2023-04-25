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
import { EVENTS } from "@notesnook/core/common";
import { initAfterSync } from "../stores/index";
import { SyncStatus, useUserStore } from "../stores/use-user-store";
import { doInBackground } from "../utils";
import { db } from "../common/database";
import { DatabaseLogger } from "../common/database/index";
import { ToastEvent } from "./event-manager";
import SettingsService from "./settings";

export const ignoredMessages = [
  "Sync already running",
  "Not allowed to start service intent",
  "WebSocket failed to connect",
  "Failed to start the HttpConnection before"
];

let syncTimer = 0;
const run = async (
  context = "global",
  forced = false,
  full = true,
  onCompleted
) => {
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
      return onCompleted?.(false);
    }
    userstore.setSyncing(true);
    let error = null;

    try {
      let res = await doInBackground(async () => {
        try {
          await db.sync(full, forced);
          return true;
        } catch (e) {
          error = e;
          return e.message;
        }
      });
      if (!res) {
        initAfterSync();
        userstore.setSyncing(false, SyncStatus.Failed);
        return onCompleted?.(false);
      }
      if (typeof res === "string") throw error;
      userstore.setSyncing(false);
      return onCompleted?.(true);
    } catch (e) {
      error = e;
      if (
        !ignoredMessages.find((im) => e.message?.includes(im)) &&
        userstore.user
      ) {
        userstore.setSyncing(false, SyncStatus.Failed);
        if (status.isConnected && status.isInternetReachable) {
          ToastEvent.error(e, "Sync failed", context);
        }
      }
      DatabaseLogger.error(e, "[Client] Failed to sync");
      onCompleted?.(false);
    } finally {
      userstore.setSyncing(
        false,
        error ? SyncStatus.Failed : SyncStatus.Passed
      );
      if (full || forced) {
        db.eventManager.publish(EVENTS.syncCompleted);
      }
    }
  }, 300);
};

const Sync = {
  run
};

export default Sync;
