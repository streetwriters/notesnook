import NetInfo from '@react-native-community/netinfo';
import { initialize, useUserStore } from '../provider/stores';
import { doInBackground } from '../utils';
import { db } from '../utils/DB';
import { eOpenLoginDialog } from '../utils/Events';
import { getNote, updateNoteInEditor } from '../views/Editor/Functions';
import { eSendEvent, ToastEvent } from './EventManager';

const run = async (context = 'global', forced) => {
  const userstore = useUserStore.getState();
  userstore.setSyncing(true);
  try {
    let res = await doInBackground(async () => {
      try {
        return await db.sync(true, forced);
      } catch (e) {
        return e.message;
      }
    });

    if (!res) return;
    if (typeof res === "string") throw new Error(res);
    ToastEvent.show({
      heading: 'Sync complete',
      type: 'success',
      message: 'All your notes are encrypted and synced!',
      context: context
    });
  } catch (e) {
    if (e.message === "Sync already running") return;
    if (e.message === 'You need to login to sync.') {
      ToastEvent.show({
        heading: 'Enable sync',
        message: 'Login to encrypt and sync notes.',
        context: context,
        func: () => {
          eSendEvent(eOpenLoginDialog);
        },
        actionText: 'Login'
      });
    } else {
      userstore.setSyncing(false);
      let status = await NetInfo.fetch();
      if (status.isConnected && status.isInternetReachable) {
        ToastEvent.show({
          heading: 'Sync failed',
          message: e.message,
          context: context
        });
      }
    }
  } finally {
    userstore.setLastSynced(await db.lastSynced());
    initialize();
    if (getNote()) {
      await updateNoteInEditor();
    }
    userstore.setSyncing(false);
  }
};

export default {
  run
};
