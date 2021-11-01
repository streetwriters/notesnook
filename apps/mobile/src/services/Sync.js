import NetInfo from '@react-native-community/netinfo';
import { initialize, useUserStore } from '../provider/stores';
import { doInBackground } from '../utils';
import { db } from '../utils/database';
import { getNote, updateNoteInEditor } from '../views/Editor/Functions';
import { ToastEvent } from './EventManager';

const run = async (context = 'global', forced) => {
  const userstore = useUserStore.getState();
  userstore.setSyncing(true);
  try {
    let res = await doInBackground(async () => {
      try {
        return await db.sync(true, forced);
      } catch (e) {
        console.log(e.stack)
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
    if (userstore.user)  {
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
    if (getNote()?.id) {
      await updateNoteInEditor();
    }
    userstore.setSyncing(false);
  }
};

export default {
  run
};
