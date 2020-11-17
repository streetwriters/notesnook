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
 * @property {Object} locked
 * @property {Object} permanant
 * @property {Object} goToEditor
 * @property {Object} share
 * @property {Object} deleteNote
 * @property {Object} fingerprintAccess
 * @property {Object} copyNote
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