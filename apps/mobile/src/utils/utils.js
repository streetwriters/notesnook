import {Dimensions, DeviceEventEmitter} from 'react-native';
export const getElevation = elevation => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

export function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval < 2 ? interval + ' year ago' : interval + ' years ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval < 2 ? interval + ' month ago' : interval + ' months ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval < 2 ? interval + ' day ago' : interval + ' days ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval < 2 ? interval + ' hour ago' : interval + ' hours ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval < 2 ? interval + ' min ago' : interval + ' min ago';
  }
  return Math.floor(seconds) + ' secs ago';
}

export const w = Dimensions.get('window').width;
export const h = Dimensions.get('window').height;

export const ToastEvent = {
  show: (message, type, duration = 1000, func = null) => {
    DeviceEventEmitter.emit('showToast', {message, type, duration, func});
  },
  hide: (message, type, duration = 1000, func = null) => {
    DeviceEventEmitter.emit('hideToast', {message, type, duration, func});
  },
};

export const SideMenuEvent = {
  open: () => {
    DeviceEventEmitter.emit('openSidebar');
  },
  close: () => {
    DeviceEventEmitter.emit('closeSidebar');
  },
  disable: () => {
    DeviceEventEmitter.emit('disableGesture');
  },
  enable: () => {
    DeviceEventEmitter.emit('enableGesture');
  },
};
