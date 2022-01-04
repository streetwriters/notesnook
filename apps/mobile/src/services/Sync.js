import NetInfo from '@react-native-community/netinfo';
import {initialize, useUserStore} from '../provider/stores';
import {doInBackground} from '../utils';
import {db} from '../utils/database';
import {getNote, updateNoteInEditor} from '../views/Editor/Functions';
import {ToastEvent} from './EventManager';

let retryCount = 0;
const run = async (context = 'global', forced) => {
  let result = false;
  const userstore = useUserStore.getState();
  if (!userstore.user) {
    initialize();
    return true;
  }
  userstore.setSyncing(true);

  try {
    let res = await doInBackground(async () => {
      try {
        return await db.sync(true, forced);
      } catch (e) {
        console.log(e.stack);
        return e.message;
      }
    });

    if (!res) {
      initialize();
      return false;
    }
    if (typeof res === 'string') throw new Error(res);
    retryCount = 0;
    result = true;
  } catch (e) {
    result = false;
    if (e.message !== 'Sync already running' && userstore.user) {
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
    return result;
  }
};

export default {
  run
};
