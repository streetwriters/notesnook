import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import { initialize, useUserStore } from '../provider/stores';
import {doInBackground} from '../utils';
import {db} from '../utils/DB';
import {eOpenLoginDialog} from '../utils/Events';
import {eSendEvent, ToastEvent} from './EventManager';

const run = async (context = 'global', forced) => {
  
  let userstore = useUserStore.getState()
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
      context: context,
    });
  } catch (e) {
    if (e.message === 'You need to login to sync.') {
      ToastEvent.show({
        heading: 'Enable sync',
        message: 'Login to encrypt and sync notes.',
        context: context,
        func: () => {
          eSendEvent(eOpenLoginDialog);
        },
        actionText: 'Login',
      });
    } else {
    
      userstore.setSyncing(false);
      ToastEvent.show({
        heading: 'Sync failed',
        message: e.message,
        context: context,
      });
    }
  } finally {
    userstore.setLastSynced(await db.lastSynced())
    initialize();
    userstore.setSyncing(false);
  }
};

export default {
  run,
};
