import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {db} from '../utils/DB';
import {eOpenLoginDialog} from '../utils/Events';
import {eSendEvent, ToastEvent} from './EventManager';

const run = async (context = 'global') => {
  updateEvent({
    type: Actions.SYNCING,
    syncing: true,
  });

  try {
    await db.sync();
    ToastEvent.show('Sync Complete', 'success', context);
  } catch (e) {
    if (e.message === 'You need to login to sync.') {
      ToastEvent.show(
        e.message,
        'error',
        context,
        5000,
        () => {
          eSendEvent(eOpenLoginDialog);
        },
        'Login',
      );
    } else {
      updateEvent({
        type: Actions.SYNCING,
        syncing: false,
      });
      ToastEvent.show(e.message, 'error', context, 3000);
    }
  } finally {
    updateEvent({
      type: Actions.LAST_SYNC,
      lastSync: await db.lastSynced(),
    });
    updateEvent({type: Actions.ALL});
    updateEvent({
      type: Actions.SYNCING,
      syncing: false,
    });
  }
};

export default {
  run,
};
