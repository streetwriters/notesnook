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
