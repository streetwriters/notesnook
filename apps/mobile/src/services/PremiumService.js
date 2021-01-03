import {CHECK_IDS} from 'notes-core/common';
import {db} from '../utils/DB';
import {eOpenPremiumDialog, eShowGetPremium} from '../utils/Events';
import {eSendEvent} from './EventManager';

let premiumStatus = true;

async function setPremiumStatus() {
  try {
    let user = await db.user.getUser();
    if (!user || !user.id) {
      premiumStatus = null;
    } else {
      premiumStatus = user.subscription.status;
    }
  } catch (e) {
    premiumStatus = null;
  }
}

function get() {
  return premiumStatus && premiumStatus !== 0 && premiumStatus !== 4;
}

async function verify(callback, error) {
  try {
    let user = await db.user.getUser();

    if (!user || !user.id || premiumStatus) {
      if (error) {
        error();
        return;
      }

      eSendEvent(eOpenPremiumDialog);
      return;
    } else {
      if (!callback) console.warn('You must provide a callback function');
      await callback();
    }
  } catch (e) {
    // show error dialog TODO
  }
}

const onUserStatusCheck = async (type) => {
  let status = get();
  let message = null;

  if (!status) {
    switch (type) {
      case CHECK_IDS.noteColor:
        message = {
          context: 'sheet',
          title: 'Get Notesnook Pro',
          desc: 'To assign colors to a note get Notesnook Pro today.',
        };
        break;
      case CHECK_IDS.noteExport:
        message = {
          context: 'export',
          title: 'Export in PDF, MD & HTML',
          desc:
            'Get Notesnook Pro to export your notes in PDF, Markdown and HTML formats!',
        };
        break;
      case CHECK_IDS.noteTag:
        message = {
          context: 'sheet',
          title: 'Get Notesnook Pro',
          desc: 'To create more tags for your notes become a Pro user today.',
        };
        break;
      case CHECK_IDS.notebookAdd:
        eSendEvent(eOpenPremiumDialog);
        break;
      case CHECK_IDS.vaultAdd:
        message = {
          context: 'sheet',
          title: 'Add Notes to Vault',
          desc:
            'With Notesnook Pro you can add notes to your vault and do so much more! Get it now.',
        };
        break;
    }
    if (message) {
      eSendEvent(eShowGetPremium, message);
    }
  }

  return {type, result: status};
};

export default {
  verify,
  setPremiumStatus,
  get,
  onUserStatusCheck,
};
