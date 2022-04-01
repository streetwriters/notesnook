import NetInfo from '@react-native-community/netinfo';
import { getNote, updateNoteInEditor } from '../screens/editor/Functions';
import { initialize, useUserStore } from '../stores/stores';
import { doInBackground } from '../utils';
import { db } from '../utils/database';
import { ToastEvent } from './event-manager';

export const ignoredMessages = ['Sync already running', 'Not allowed to start service intent'];

const run = async (context = 'global', forced = false, full = true) => {
  let result = false;
  const userstore = useUserStore.getState();
  if (!userstore.user) {
    initialize();
    return true;
  }
  userstore.setSyncing(true);
  let error = null;
  console.log('Sync.run started');
  try {
    let res = await doInBackground(async () => {
      try {
        return await db.sync(full, forced);
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
      let status = await NetInfo.fetch();
      if (status.isConnected && status.isInternetReachable) {
        ToastEvent.error(e, 'Sync failed', context);
      }
    }
  } finally {
    userstore.setLastSynced(await db.lastSynced());
    initialize();
    if (getNote()?.id) {
      await updateNoteInEditor();
    }

    console.log('sync done');
    userstore.setSyncing(false);
  }
  return result;
};

const Sync = {
  run
};

export default Sync;
