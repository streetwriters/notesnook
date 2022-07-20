import NetInfo from '@react-native-community/netinfo';
import { EVENTS } from '@streetwriters/notesnook-core/common';
import { initialize } from '../stores';
import { useUserStore } from '../stores/use-user-store';
import { doInBackground } from '../utils';
import { db } from '../utils/database';
import { ToastEvent } from './event-manager';
import { DatabaseLogger } from '../utils/database/index';

NetInfo.configure({
  reachabilityUrl: 'https://bing.com'
});

export const ignoredMessages = [
  'Sync already running',
  'Not allowed to start service intent',
  'WebSocket failed to connect'
];

const run = async (context = 'global', forced = false, full = true) => {
  let result = false;
  const status = await NetInfo.fetch();
  const userstore = useUserStore.getState();
  const user = await db.user.getUser();
  if (!status.isInternetReachable) {
    DatabaseLogger.warn('Internet not reachable');
  }
  if (!user || !status.isInternetReachable) {
    initialize();
    return true;
  }
  userstore.setSyncing(true);
  let error = null;
  console.log('Sync.run started');
  try {
    console.log('DO IN BACKGROUND START');
    let res = await doInBackground(async () => {
      try {
        console.log('DO IN BACKGROUND');
        await db.sync(full, forced);
        return true;
      } catch (e) {
        error = e;
        return e.message;
      }
    });
    if (!res) {
      initialize();
      return false;
    }
    if (typeof res === 'string') throw error;

    userstore.setSyncing(false);
    result = true;
  } catch (e) {
    result = false;

    if (!ignoredMessages.find(im => e.message?.includes(im)) && userstore.user) {
      userstore.setSyncing(false);
      console.log(status.isConnected, status.isInternetReachable);
      if (status.isConnected && status.isInternetReachable) {
        ToastEvent.error(e, 'Sync failed', context);
      }
    }
    DatabaseLogger.error(e, '[Client] Failed to sync');
  } finally {
    if (full || forced) {
      db.eventManager.publish(EVENTS.syncCompleted);
    }
    console.log('sync done');
  }
  return result;
};

const Sync = {
  run
};

export default Sync;
