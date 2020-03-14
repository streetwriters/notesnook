import {DeviceEventEmitter} from 'react-native';

export const eSubscribeEvent = (eventName, action) => {
  DeviceEventEmitter.addListener(eventName, action);
};

export const eUnSubscribeEvent = (eventName, action) => {
  DeviceEventEmitter.removeListener(eventName, action);
};

export const eSendEvent = (eventName, data) => {
  DeviceEventEmitter.emit(eventName, data);
};

export const openVault = (
  item,
  novault = false,
  locked = false,
  permanant = false,
  editor = false,
  share = false,
  deleteNote = false,
) => {
  eSendEvent(eOpenVaultDialog, {
    item,
    novault,
    locked,
    permanant,
    goToEditor: editor,
    share,
    deleteNote,
  });
};
