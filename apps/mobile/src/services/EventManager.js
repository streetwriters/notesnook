import EventManager from 'notes-core/utils/event-manager';
import {
  eHideToast,
  eOnNoteEdited,
  eOpenVaultDialog,
  eShowToast,
} from '../utils/Events';
const eventManager = new EventManager();

export const eSubscribeEvent = (eventName, action) => {
  eventManager.subscribe(eventName, action);
};

export const eUnSubscribeEvent = (eventName, action) => {
  eventManager.unsubscribe(eventName, action);
};

export const eSendEvent = (eventName, data) => {
  eventManager.publish(eventName, data);
};

/**
 * @typedef {Object} vaultType
 * @property {Object} item
 * @property {boolean} novault
* @property {string} title
* @property {string} description
 * @property {boolean} locked
 * @property {boolean} permanant
 * @property {boolean} goToEditor
 * @property {boolean} share
 * @property {boolean} deleteNote
 * @property {boolean} fingerprintAccess
 * @property {boolean} revokeFingerprintAccess
 * @property {boolean} changePassword
 * @property {boolean} copyNote
 * @param {vaultType} data
 */

export const openVault = (data) => {
  eSendEvent(eOpenVaultDialog, data);
};

/**
 * @typedef {Object} noteEdit
 * @property {string} id
 * @property {boolean} closed
 * @property {boolean} noEdit
 * @property {boolean} forced
 * @param {noteEdit} data
 */
export function sendNoteEditedEvent(data) {
  eSendEvent(eOnNoteEdited, data);
}

export const ToastEvent = {
  show: (
    message,
    type = 'error',
    context = 'global',
    duration = 3000,
    func = null,
    actionText = '',
  ) => {
    eSendEvent(eShowToast, {
      message,
      type,
      context,
      duration,
      func,
      actionText,
    });
  },
  hide: (
    message,
    type = 'error',
    context = 'global',
    duration = 3000,
    func = null,
    actionText = '',
  ) => {
    eSendEvent(eHideToast, {
      message,
      type,
      context,
      duration,
      func,
      actionText,
    });
  },
};
