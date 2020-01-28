import {DeviceEventEmitter, Dimensions} from 'react-native';
import {eSendEvent} from '../services/eventManager';
import {
  eOpenSideMenu,
  eCloseSideMenu,
  eDisableGestures,
  eEnableGestures,
  eShowToast,
  eHideToast,
} from '../services/events';
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

  if (interval > 0.9) {
    return interval < 2 ? interval + ' year ago' : interval + ' years ago';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' month ago' : interval + ' months ago';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' day ago' : interval + ' days ago';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' hour ago' : interval + ' hours ago';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 0.9) {
    return interval < 2 ? interval + ' min ago' : interval + ' min ago';
  }
  return Math.floor(seconds) + ' secs ago';
}

export const w = Dimensions.get('window').width;
export const h = Dimensions.get('window').height;

export const ToastEvent = {
  show: (message, type, duration = 10000, func = null, actionText = '') => {
    eSendEvent(eShowToast, {
      message,
      type,
      duration,
      func,
      actionText,
    });
  },
  hide: (message, type, duration = 1000, func = null, actionText = '') => {
    eSendEvent(eHideToast, {
      message,
      type,
      duration,
      func,
      actionText,
    });
  },
};

export const SideMenuEvent = {
  open: () => {
    eSendEvent(eOpenSideMenu);
  },
  close: () => {
    eSendEvent(eCloseSideMenu);
  },
  disable: () => {
    eSendEvent(eDisableGestures);
  },
  enable: () => {
    eSendEvent(eEnableGestures);
  },
};
