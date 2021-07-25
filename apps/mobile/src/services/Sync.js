import NetInfo from '@react-native-community/netinfo';
import {initialize, useUserStore} from '../provider/stores';
import {doInBackground} from '../utils';
import {db} from '../utils/DB';
import {eOpenLoginDialog} from '../utils/Events';
import {getNote, updateNoteInEditor} from '../views/Editor/Functions';
import {eSendEvent, ToastEvent} from './EventManager';

const run = async (context = 'global', forced) => {
  let userstore = useUserStore.getState();
  if (userstore.syncing) {
    ToastEvent.show({
      heading: 'Sync running already',
      message:"Please wait a few moments",
      type: 'success'
    });
    return;
  }
  userstore.setSyncing(true);
  try {
    let res = await doInBackground(async () => {
      try {
        await db.sync(true, forced);
        return true;
      } catch (e) {
        return e.message;
      }
    });

    if (res !== true) throw new Error(res);

    ToastEvent.show({
      heading: 'Sync complete',
      type: 'success',
      message: 'All your notes are encrypted and synced!',
      context: context
    });
  } catch (e) {
    console.log(e);
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
