import {DeviceEventEmitter} from 'react-native';
import {eHideToast, eOnNoteEdited, eOpenVaultDialog, eShowToast} from '../utils/Events';

export const eSubscribeEvent = (eventName, action) => {
  DeviceEventEmitter.addListener(eventName, action);
};

export const eUnSubscribeEvent = (eventName, action) => {
  DeviceEventEmitter.removeListener(eventName, action);
};

export const eSendEvent = (eventName, data) => {
  DeviceEventEmitter.emit(eventName, data);


};

/**
 * @typedef {Object} vaultType
 * @property {Object} item
 * @property {boolean} novault
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

export function sendNoteEditedEvent(id="",closed=false,noEdit=false) {
    eSendEvent(eOnNoteEdited , {id,closed, noEdit});
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