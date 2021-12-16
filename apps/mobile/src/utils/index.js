import {createRef} from 'react';
import {Dimensions, Image, NativeModules, Platform} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import {
  beginBackgroundTask,
  endBackgroundTask
} from 'react-native-begin-background-task';
import RNTooltips from 'react-native-tooltips';
import {dummyRef} from '../components/DummyText';
import {useSettingStore} from '../provider/stores';
import {eSendEvent} from '../services/EventManager';
import Navigation from '../services/Navigation';
import * as ackeeTracker from './ackee';
import {eOpenPremiumDialog, refreshNotesPage} from './Events';
import {MMKV} from './mmkv';
import {tabBarRef} from './Refs';
import {SIZE} from './SizeUtils';

export const APP_VERSION = 1694;

export const Tracker = ackeeTracker.create('https://sa.streetwriters.co', {
  ignoreLocalhost: true
});

const imgNames = [
  'favorites',
  'notes',
  'notebooks',
  'tags',
  'trash',
  'login',
  'welcome',
  'vault',
  'accent',
  'settings',
  'backup',
  'community',
  'export',
  'organize',
  'privacy',
  'sync',
  'richtext'
];

export const updateList = items => {
  eSendEvent('onListUpdate', items);
};

export const InteractionManager = {
  runAfterInteractions: (func, time = 300) => setTimeout(func, time)
};

export async function setSetting(settings, name, value) {
  let s = {...settings};
  s[name] = value;
  await MMKV.setStringAsync('appSettings', JSON.stringify(s));
  useSettingStore.getState().setSettings(s);
}

export const scrollRef = createRef();
export const AndroidModule = NativeModules.NNativeModule;

export const getElevation = elevation => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation
  };
};

export const sortSettings = {
  sort: 'default',
  /**
   * @type {"desc" | "asc"}
   */
  sortOrder: 'desc'
};

export const GROUP = {
  default: 'default',
  abc: 'abc',
  year: 'year',
  week: 'week',
  month: 'month'
};

export const SORT = {
  dateEdited: 'Date edited',
  dateCreated: 'Date created'
  //title:"Title",
};

export const editing = {
  currentlyEditing: false,
  isFullscreen: false,
  actionAfterFirstSave: {
    type: null
  },
  isFocused: false,
  focusType: null,
  movedAway: true,
  tooltip: false,
  isRestoringState: false
};
export const selection = {
  data: [],
  type: null,
  selectedItems: []
};

export const history = {
  selectedItemsList: [],
  selectionMode: false
};

export async function showContext(event, title) {
  event._targetInst.ref.current?.measureInWindow((x, y, w, h) => {
    dummyRef.current.setNativeProps({
      style: {
        fontSize: SIZE.sm
      }
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
          y: yVal
        },
        title: title
      });
    });
  });
}

export const bgTaskOptions = {
  taskName: 'notesnookSync',
  taskTitle: 'Notesnook Sync',
  taskDesc: 'Syncing your notes.',
  taskIcon: {
    name: 'ic_stat_name',
    type: 'drawable'
  },
  color: '#ffffff'
};

export async function doInBackground(cb) {
  if (Platform.OS === 'ios') {
    let bgTaskId;
    try {
      bgTaskId = await beginBackgroundTask();
      let res = await cb();
      await endBackgroundTask(bgTaskId);
      return res;
    } catch (e) {
      return e.message;
    }
  } else {
    return new Promise(async (res, rej) => {
      try {
        await BackgroundService.start(async () => {
          let result = await cb();
          await BackgroundService.stop();
          res(result);
        }, bgTaskOptions);
      } catch (e) {
        res(e.message);
      }
    });
  }
}

export let dWidth = Dimensions.get('window').width;
export let dHeight = Dimensions.get('window').height;

export function setWidthHeight(size) {
  dWidth = size.width;
  dHeight = size.height;
}

export function getTotalNotes(notebook) {
  if (notebook.type === 'topic') {
    return notebook.notes.length;
  }
  if (!notebook.topics) return 0;
  return notebook.topics.reduce((sum, topic) => {
    return sum + topic.notes.length;
  }, 0);
}

export const itemSkus = [
  'com.streetwriters.notesnook.sub.mo',
  'com.streetwriters.notesnook.sub.yr',
  'com.streetwriters.notesnook.sub.yr.15',
  'com.streetwriters.notesnook.sub.mo.15',
  'com.streetwriters.notesnook.sub.mo.ofr',
  'com.streetwriters.notesnook.sub.yr.trialoffer',
  'com.streetwriters.notesnook.sub.mo.trialoffer'
];

export const MenuItemsList = [
  {
    name: 'Notes',
    icon: 'home-variant-outline',
    close: true
  },
  {
    name: 'Notebooks',
    icon: 'book-outline',
    close: true
  },
  {
    name: 'Favorites',
    icon: 'star-outline',
    close: true
  },
  {
    name: 'Tags',
    icon: 'pound',
    close: true
  },
  {
    name: 'Monographs',
    icon: 'text-box-multiple-outline',
    close: true,
    func: () => {
      let params = {
        type: 'notes',
        menu: true,
        get: 'monographs',
        title: 'Monographs',
        id: 'monographs_navigation'
      };

      eSendEvent(refreshNotesPage, params);
      Navigation.navigate('NotesPage', params, {
        heading: 'Monographs',
        id: 'monographs_navigation',
        type: 'notes'
      });
    }
  },
  {
    name: 'Trash',
    icon: 'delete-outline',
    close: true
  }
];

export const SUBSCRIPTION_STATUS = {
  BASIC: 0,
  TRIAL: 1,
  BETA: 2,
  PREMIUM: 5,
  PREMIUM_EXPIRED: 6,
  PREMIUM_CANCELLED: 7
};

export const SUBSCRIPTION_STATUS_STRINGS = {
  0: 'Basic',
  1: 'Trial',
  2: Platform.OS === 'ios' ? 'Pro' : 'Beta',
  5: 'Pro',
  6: 'Expired',
  7: 'Pro'
};

export const SUBSCRIPTION_PROVIDER = {
  0: null,
  1: {
    type: 'iOS',
    title: 'Subscribed on iOS',
    desc: 'You subscribed to Notesnook Pro on iOS using Apple In App Purchase. You can cancel anytime with your iTunes Account settings.',
    icon: 'ios'
  },
  2: {
    type: 'Android',
    title: 'Subscribed on Android',
    desc: 'You subscribed to Notesnook Pro on Android Phone/Tablet using Google In App Purchase.',
    icon: 'android'
  },
  3: {
    type: 'Web',
    title: 'Subscribed on Web',
    desc: 'You subscribed to Notesnook Pro on the Web/Desktop App.',
    icon: 'web'
  }
};

export const BUTTON_TYPES = {
  transparent: {
    primary: 'transparent',
    text: 'accent',
    selected: 'nav'
  },
  gray: {
    primary: 'transparent',
    text: 'icon',
    selected: 'transGray'
  },
  grayBg: {
    primary: 'nav',
    text: 'icon',
    selected: 'nav'
  },
  accent: (themeColor, text) => ({
    primary: themeColor,
    text: text,
    selected: themeColor
  }),
  inverted: {
    primary: 'bg',
    text: 'accent',
    selected: 'bg'
  },
  white: {
    primary: 'transparent',
    text: 'light',
    selected: 'transGray'
  },
  shade: {
    primary: 'shade',
    text: 'accent',
    selected: 'accent',
    opacity: 0.12
  },
  error: {
    primary: 'red',
    text: 'red',
    selected: 'red',
    opacity: 0.12
  },
  errorShade: {
    primary: 'transparent',
    text: 'red',
    selected: 'red',
    opacity: 0.12
  },
  warn: {
    primary: 'warningBg',
    text: 'warningText',
    selected: 'warningBg',
    opacity: 0.12
  }
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
  BOTTOM: 4
};

export function showTooltip(event, text, position) {
  if (!event._targetInst?.ref?.current) return;
  RNTooltips.Show(event._targetInst.ref.current, tabBarRef.current, {
    text: text,
    tintColor: 'black',
    corner: 40,
    textSize: 14,
    position: position
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
