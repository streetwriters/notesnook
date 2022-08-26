import NetInfo from "@react-native-community/netinfo";
import { EVENTS } from "@streetwriters/notesnook-core/common";
import { initAfterSync } from "../stores/index";
import { useUserStore } from "../stores/use-user-store";
import { doInBackground } from "../utils";
import { db } from "../common/database";
import { DatabaseLogger } from "../common/database/index";
import { ToastEvent } from "./event-manager";

NetInfo.configure({
  reachabilityUrl: "https://bing.com",
  reachabilityTest: (response) => {
    if (!response) return false;
    return response?.status >= 200 && response?.status < 300;
  }
});

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
    if (!user || !status.isInternetReachable) {
      initAfterSync();
      return onCompleted?.(false);
    }
    userstore.setSyncing(true);
    let error = null;
    console.log("Sync.run started");
    try {
      console.log("DO IN BACKGROUND START");
      let res = await doInBackground(async () => {
        try {
          console.log("DO IN BACKGROUND");
          await db.sync(full, forced);
          return true;
        } catch (e) {
          error = e;
          return e.message;
        }
      });
      if (!res) {
        initAfterSync();
        userstore.setSyncing(false);
        return onCompleted?.(false);
      }
      if (typeof res === "string") throw error;
      userstore.setSyncing(false);
      return onCompleted?.(true);
    } catch (e) {
      if (
        !ignoredMessages.find((im) => e.message?.includes(im)) &&
        userstore.user
      ) {
        userstore.setSyncing(false);
        console.log(status.isConnected, status.isInternetReachable);
        if (status.isConnected && status.isInternetReachable) {
          ToastEvent.error(e, "Sync failed", context);
        }
      }
      DatabaseLogger.error(e, "[Client] Failed to sync");
      onCompleted?.(false);
    } finally {
      userstore.setSyncing(false);
      if (full || forced) {
        db.eventManager.publish(EVENTS.syncCompleted);
      }
    }
  }, 1000);
};

const Sync = {
  run
};

export default Sync;
