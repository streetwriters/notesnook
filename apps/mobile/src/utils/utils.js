import {Dimensions, Platform} from 'react-native';
import Database from 'notes-core/api/';
import {eSendEvent} from '../services/eventManager';
import {eShowToast, eHideToast} from '../services/events';
import {DeviceDetectionService} from './deviceDetection';
import StorageInterface, {MMKV} from './storage';
import {updateEvent} from '../components/DialogManager/recievers';
import {ACTIONS} from '../provider/actions';
import ESource from './event-source';
import EventSource from 'rn-eventsource';
import {PERMISSIONS, requestMultiple, RESULTS} from 'react-native-permissions';

global.Buffer = require('buffer').Buffer;

export const DDS = new DeviceDetectionService();
export const db = new Database(
  StorageInterface,
  Platform.OS === 'ios' ? EventSource : ESource,
);
db.host('http://192.168.10.8:8000');

export async function setSetting(settings, name, value) {
  let s = {...settings};
  s[name] = value;
  await MMKV.setStringAsync('settings', JSON.stringify(s));

  updateEvent({type: ACTIONS.SETTINGS, settings: s});
}

export const getElevation = (elevation) => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

export const editing = {
  currentlyEditing: false,
  isFullscreen: false,
  actionAfterFirstSave: {
    type: null,
  },
};
export const selection = {
  data: [],
  type: null,
  selectedItems: [],
};

export const history = {
  selectedItemsList: [],
};

export async function requestStoragePermission() {
  let granted = false;
  try {
    const response = await requestMultiple([
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ]);
    granted =
      response['android.permission.READ_EXTERNAL_STORAGE'] ===
        RESULTS.GRANTED &&
      response['android.permission.WRITE_EXTERNAL_STORAGE'] === RESULTS.GRANTED;
  } catch (err) {
    console.log(error);
  } finally {
    return granted;
  }
}

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

export const timeConverter = (timestamp) => {
  if (!timestamp) return;
  var d = new Date(timestamp), // Convert the passed timestamp to milliseconds
    yyyy = d.getFullYear(),
    mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
    dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
    currentDay = d.getDay(),
    hh = d.getHours(),
    h = hh,
    min = ('0' + d.getMinutes()).slice(-2), // Add leading 0.
    ampm = 'AM',
    time;
  let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  if (hh > 12) {
    h = hh - 12;
    ampm = 'PM';
  } else if (hh === 12) {
    h = 12;
    ampm = 'PM';
  } else if (hh == 0) {
    h = 12;
  }

  // ie: 2013-02-18, 8:35 AM
  time =
    days[currentDay] +
    ' ' +
    dd +
    ' ' +
    months[d.getMonth()] +
    ', ' +
    yyyy +
    ', ' +
    h +
    ':' +
    min +
    ' ' +
    ampm;

  return time;
};

const isValidHex = (hex) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);

const getChunksFromString = (st, chunkSize) =>
  st.match(new RegExp(`.{${chunkSize}}`, 'g'));

const convertHexUnitTo256 = (hexStr) =>
  parseInt(hexStr.repeat(2 / hexStr.length), 16);

const getAlphafloat = (a, alpha) => {
  if (typeof a !== 'undefined') {
    return a / 256;
  }
  if (typeof alpha !== 'undefined') {
    if (1 < alpha && alpha <= 100) {
      return alpha / 100;
    }
    if (0 <= alpha && alpha <= 1) {
      return alpha;
    }
  }
  return 1;
};

const rgbRes = {
  color: '',
  result: '',
};

export const hexToRGBA = (hex, alpha) => {
  if (rgbRes.color === hex) return rgbRes.result;
  if (!isValidHex(hex)) {
    return hex;
  }
  const chunkSize = Math.floor((hex.length - 1) / 3);
  const hexArr = getChunksFromString(hex.slice(1), chunkSize);
  const [r, g, b, a] = hexArr.map(convertHexUnitTo256);
  return `rgba(${r}, ${g}, ${b}, ${getAlphafloat(a, alpha)})`;
};

export const shadeBlendConvert = function (p, from, to) {
  if (
    typeof p != 'number' ||
    p < -1 ||
    p > 1 ||
    typeof from != 'string' ||
    (from[0] != 'r' && from[0] != '#') ||
    (to && typeof to != 'string')
  )
    return null; //ErrorCheck
  if (!this.sbcRip)
    this.sbcRip = (d) => {
      let l = d.length,
        RGB = {};
      if (l > 9) {
        d = d.split(',');
        if (d.length < 3 || d.length > 4) return null; //ErrorCheck
        (RGB[0] = i(d[0].split('(')[1])),
          (RGB[1] = i(d[1])),
          (RGB[2] = i(d[2])),
          (RGB[3] = d[3] ? parseFloat(d[3]) : -1);
      } else {
        if (l == 8 || l == 6 || l < 4) return null; //ErrorCheck
        if (l < 6)
          d =
            '#' +
            d[1] +
            d[1] +
            d[2] +
            d[2] +
            d[3] +
            d[3] +
            (l > 4 ? d[4] + '' + d[4] : ''); //3 or 4 digit
        (d = i(d.slice(1), 16)),
          (RGB[0] = (d >> 16) & 255),
          (RGB[1] = (d >> 8) & 255),
          (RGB[2] = d & 255),
          (RGB[3] = -1);
        if (l == 9 || l == 5)
          (RGB[3] = r((RGB[2] / 255) * 10000) / 10000),
            (RGB[2] = RGB[1]),
            (RGB[1] = RGB[0]),
            (RGB[0] = (d >> 24) & 255);
      }
      return RGB;
    };
  var i = parseInt,
    r = Math.round,
    h = from.length > 9,
    h =
      typeof to == 'string'
        ? to.length > 9
          ? true
          : to == 'c'
          ? !h
          : false
        : h,
    b = p < 0,
    p = b ? p * -1 : p,
    to = to && to != 'c' ? to : b ? '#000000' : '#FFFFFF',
    f = this.sbcRip(from),
    t = this.sbcRip(to);
  if (!f || !t) return null; //ErrorCheck
  if (h)
    return (
      'rgb' +
      (f[3] > -1 || t[3] > -1 ? 'a(' : '(') +
      r((t[0] - f[0]) * p + f[0]) +
      ',' +
      r((t[1] - f[1]) * p + f[1]) +
      ',' +
      r((t[2] - f[2]) * p + f[2]) +
      (f[3] < 0 && t[3] < 0
        ? ')'
        : ',' +
          (f[3] > -1 && t[3] > -1
            ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000
            : t[3] < 0
            ? f[3]
            : t[3]) +
          ')')
    );
  else
    return (
      '#' +
      (
        0x100000000 +
        r((t[0] - f[0]) * p + f[0]) * 0x1000000 +
        r((t[1] - f[1]) * p + f[1]) * 0x10000 +
        r((t[2] - f[2]) * p + f[2]) * 0x100 +
        (f[3] > -1 && t[3] > -1
          ? r(((t[3] - f[3]) * p + f[3]) * 255)
          : t[3] > -1
          ? r(t[3] * 255)
          : f[3] > -1
          ? r(f[3] * 255)
          : 255)
      )
        .toString(16)
        .slice(1, f[3] > -1 || t[3] > -1 ? undefined : -2)
    );
};

const shadeRes = {
  color: '',
  alpha: 0,
  result: '',
};
export const RGB_Linear_Shade = (p, c) => {
  if (shadeRes.color === c && shadeRes.alpha === p) return shadeRes.result;
  var i = parseInt,
    r = Math.round,
    [a, b, c, d] = c.split(','),
    P = p < 0,
    t = P ? 0 : 255 * p,
    P = P ? 1 + p : 1 - p;
  return (
    'rgb' +
    (d ? 'a(' : '(') +
    r(i(a[3] == 'a' ? a.slice(5) : a.slice(4)) * P + t) +
    ',' +
    r(i(b) * P + t) +
    ',' +
    r(i(c) * P + t) +
    (d ? ',' + d : ')')
  );
};

export const itemSkus = Platform.select({
  ios: ['com.streetwriters.notesnook.sub.mo'],
  android: ['com.streetwriters.notesnook.sub.mo'],
});
