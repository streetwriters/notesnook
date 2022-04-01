import Clipboard from '@react-native-clipboard/clipboard';
import NetInfo from '@react-native-community/netinfo';
import { getNote, updateNoteInEditor } from '../screens/editor/Functions';
import { initialize, useUserStore } from '../stores/stores';
import { doInBackground } from '../utils';
import { db } from '../utils/database';
import { ToastEvent } from './event-manager';

const ignoredMessages = ['Sync already running', 'Not allowed to start service intent'];

const run = async (context = 'global', forced = false, full = true) => {
  let result = false;
  const userstore = useUserStore.getState();
  if (!userstore.user) {
    initialize();
    return true;
  }
  userstore.setSyncing(true);
  let errorStack = null;
  try {
    let res = await doInBackground(async () => {
      try {
        return await db.sync(full, forced);
      } catch (e) {
        errorStack = e.stack;
        return e.message;
      }
    });

    if (!res) {
      initialize();
      return false;
    }
    if (typeof res === 'string') throw new Error(res);

    result = true;
  } catch (e) {
    result = false;
    console.log(e.stack);
    if (!ignoredMessages.find(im => e.message?.includes(im)) && userstore.user) {
      userstore.setSyncing(false);
      let status = await NetInfo.fetch();
      if (status.isConnected && status.isInternetReachable) {
        ToastEvent.show({
          heading: 'Sync failed',
          message: e.message,
          context: context,
          actionText: 'Copy logs',
          func: () => {
            if (errorStack) {
              Clipboard.setString(errorStack);
              ToastEvent.show({
                heading: 'Logs copied!',
                type: 'success',
                context: 'global'
              });
            }
          }
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
  return result;
};

const Sync = {
  run
};

export default Sync;
