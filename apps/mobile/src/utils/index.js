import {createRef} from 'react';
import {Dimensions, NativeModules, Platform} from 'react-native';
import RNTooltips from 'react-native-tooltips';
import {updateEvent} from '../components/DialogManager/recievers';
import {dummyRef} from '../components/DummyText';
import {Actions} from '../provider/Actions';
import {defaultState} from '../provider/DefaultState';
import {eSendEvent} from '../services/EventManager';
import {MMKV} from './mmkv';
import {tabBarRef} from './Refs';
import {SIZE} from './SizeUtils';

export const InteractionManager = {
  runAfterInteractions: (func, time = 500) => setTimeout(func, time),
};

export const APP_VERSION = 1300;

export async function setSetting(settings, name, value) {
  let s = {...settings};
  s[name] = value;
  await MMKV.setStringAsync('appSettings', JSON.stringify(s));
  updateEvent({type: Actions.SETTINGS, settings: s});
}

export const scrollRef = createRef();
export const AndroidModule = NativeModules.NNativeModule;

export const getElevation = (elevation) => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

export const sortSettings = {
  sort: defaultState.settings.sort,
  sortOrder: 'desc',
};

export const SORT = {
  default: null,
  alphabetical: 'abc',
  year: 'year',
  week: 'week',
  month: 'month',
};

export const editing = {
  currentlyEditing: false,
  isFullscreen: false,
  actionAfterFirstSave: {
    type: null,
  },
  isFocused: false,
  focusType: null,
  movedAway: true,
  tooltip: false,
};
export const selection = {
  data: [],
  type: null,
  selectedItems: [],
};

export const history = {
  selectedItemsList: [],
};

export async function showContext(event, title) {
  event._targetInst.ref.current?.measureInWindow((x, y, w, h) => {
    dummyRef.current.setNativeProps({
      style: {
        fontSize: SIZE.sm,
      },
    });
    dummyRef.current?.measure((xt, yt, wt, ht) => {
      let xVal;
      let yVal;

      if (x > dWidth / 50) {
        xVal = x - (w + (wt * title.length - 40));
      } else {
        xVal = x + (w + (wt * title.length - 40));
      }

      yVal = y + h / 2 + 10;

      eSendEvent('showContextMenu', {
        location: {
          x: xVal,
          y: yVal,
        },
        title: title,
      });
    });
  });
}

export let dWidth = Dimensions.get('window').width;
export let dHeight = Dimensions.get('window').height;

export function setWidthHeight(size) {
  dWidth = size.width;
  dHeight = size.height;
}

export const itemSkus = Platform.select({
  ios: ['com.streetwriters.notesnook.sub.mo'],
  android: ['com.streetwriters.notesnook.sub.mo'],
});

export const MenuItemsList = [
  {
    name: 'Notes',
    icon: 'home-variant-outline',
    close: true,
  },
  {
    name: 'Notebooks',
    icon: 'book-outline',
    close: true,
  },
  {
    name: 'Favorites',
    icon: 'star-outline',
    close: true,
  },
  {
    name: 'Tags',
    icon: 'pound',
    close: true,
  },
  {
    name: 'Trash',
    icon: 'delete-outline',
    close: true,
  },
];

export const SUBSCRIPTION_STATUS = {
  BASIC: 0,
  TRIAL: 1,
  BETA: 2,
  TRIAL_EXPIRED: 3,
  BETA_EXPIRED: 4,
};

export const SUBSCRIPTION_STATUS_STRINGS = {
  0: 'Basic',
  1: 'Trial',
  2: 'Beta',
  5: 'Pro',
  6: 'Expired',
  7: 'Pro',
};

export const SUBSCRIPTION_PROVIDER = {
  0: null,
  1: {
    type: 'iOS',
    title: 'Subscribed on iOS',
    desc: 'You subscribed to Notesnook Pro on iOS using Apple In App Purchase.',
    icon: 'ios',
  },
  2: {
    type: 'Android',
    title: 'Subscribed on Android',
    desc:
      'You subscribed to Notesnook Pro on Android Phone/Tablet using Google In App Purchase.',
    icon: 'android',
  },
  3: {
    type: 'Web',
    title: 'Subscribed on Web',
    desc: 'You subscribed to Notesnook Pro on the Web/Desktop App.',
    icon: 'web',
  },
};

export const BUTTON_TYPES = {
  transparent: {
    primary: 'transparent',
    text: 'accent',
    selected: 'shade',
  },
  gray: {
    primary: 'transparent',
    text: 'icon',
    selected: 'transGray',
  },
  grayBg: {
    primary: 'nav',
    text: 'icon',
    selected: 'nav',
  },
  accent: (themeColor, text) => ({
    primary: themeColor,
    text: text,
    selected: themeColor,
  }),
  inverted: {
    primary: 'bg',
    text: 'accent',
    selected: 'bg',
  },
  shade: {
    primary: 'shade',
    text: 'accent',
    selected: 'accent',
    opacity: 0.12,
  },
  error: {
    primary: 'red',
    text: 'red',
    selected: 'red',
    opacity: 0.12,
  },
  errorShade: {
    primary: 'transparent',
    text: 'red',
    selected: 'red',
    opacity: 0.12,
  },
};
let he;

export function toTXT(html) {
  let text = html.replace(/<br[^>]*>/gi, '\n').replace(/<[^>]+>/g, '');
  if (!he) {
    he = require('he');
  }
  return he.decode(text);
}

export const TOOLTIP_POSITIONS = {
  LEFT: 1,
  RIGHT: 2,
  TOP: 3,
  BOTTOM: 4,
};

export function showTooltip(event, text, position) {
  if (!event._targetInst?.ref?.current) return;
  RNTooltips.Show(event._targetInst.ref.current, tabBarRef.current, {
    text: text,
    tintColor: 'black',
    corner: 40,
    textSize: 14,
    position: position,
  });
}

let appIsInitialized = false;

export function setAppIsInitialized(value) {
  appIsInitialized = value;
}

export function getAppIsIntialized() {
  return appIsInitialized;
}

let intentOnAppLoadProcessed = false;

export function setIntentOnAppLoadProcessed(value) {
  intentOnAppLoadProcessed = value;
}

export function getIntentOnAppLoadProcessed() {
  return intentOnAppLoadProcessed;
}
