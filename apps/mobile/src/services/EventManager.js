import EventManager from 'notes-core/utils/event-manager';
import {
  eHideToast,
  eOnNoteEdited,
  eOpenProgressDialog,
  eOpenVaultDialog,
  eShowToast
} from '../utils/events';
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
 * @property {boolean} clearVault
 * @property {boolean} deleteVault
 * @property {boolean} copyNote
 * @param {vaultType} data
 */

export const openVault = data => {
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

export function presentSheet(data) {
  eSendEvent(eOpenProgressDialog, data);
}

export const ToastEvent = {
  /**
   * @typedef {Object} event
   * @property {string} heading
   * @property {string} message
   * @property {"global" | "local"} context
   * @property {"error" | "success"} type
   * @property {number} duration
   * @property {function} func
   * @property {string} actionText
   *
   * @param {event} data
   */
  show: data =>
    eSendEvent(eShowToast, {
      heading: data.heading,
      message: data.message,
      type: data.type || 'error',
      context: data.context || 'global',
      duration: data.duration || 3000,
      func: data.func || null,
      actionText: data.actionText || null
    }),
  hide: () => eSendEvent(eHideToast)
};

/*

*/
