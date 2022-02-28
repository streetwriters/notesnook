import Clipboard from '@react-native-clipboard/clipboard';
import EventManager from 'notes-core/utils/event-manager';
import {
  eHideToast,
  eOnNoteEdited,
  eOpenProgressDialog,
  eOpenVaultDialog,
  eShowToast
} from '../utils/events';
const eventManager = new EventManager();

export const eSubscribeEvent = (eventName: string, action?: (data: any) => void) => {
  eventManager.subscribe(eventName, action);
};

export const eUnSubscribeEvent = (eventName: string, action?: (data: any) => void) => {
  eventManager.unsubscribe(eventName, action);
};

export const eSendEvent = (eventName: string, data?: any) => {
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
export const openVault = (data: any) => {
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
export function sendNoteEditedEvent(data: any) {
  eSendEvent(eOnNoteEdited, data);
}

export function presentSheet(data: any) {
  eSendEvent(eOpenProgressDialog, data);
}

export type ShowToastEvent = {
  heading?: string;
  message?: string;
  context?: 'global' | 'local';
  type?: 'error' | 'success';
  duration?: number;
  func?: () => void;
  actionText?: string;
};

export const ToastEvent = {
  show: ({
    heading,
    message,
    type = 'error',
    context,
    duration,
    func,
    actionText
  }: ShowToastEvent) =>
    eSendEvent(eShowToast, {
      heading: heading,
      message: message,
      type: type,
      context: context,
      duration: duration,
      func: func,
      actionText: actionText
    }),
  hide: () => eSendEvent(eHideToast),
  error: (e: Error, title?: string, context?: 'global' | 'local') => {
    ToastEvent.show({
      heading: title,
      message: e?.message || '',
      type: 'error',
      context: context || 'global',
      actionText: 'Copy logs',
      duration: 6000,
      func: () => {
        Clipboard.setString(e?.stack || '');
        ToastEvent.show({
          heading: 'Logs copied!',
          type: 'success',
          context: 'global',
          duration: 5000
        });
      }
    });
  }
};

/*

*/
