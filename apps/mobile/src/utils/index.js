import {Dimensions, NativeModules, Platform} from 'react-native';
import {eSendEvent} from '../services/EventManager';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {MMKV} from './mmkv';
import RNFetchBlob from 'rn-fetch-blob';
import {defaultState} from '../provider/DefaultState';
import {createRef} from 'react';
import {dummyRef} from '../components/DummyText';
import {SIZE} from './SizeUtils';

export async function setSetting(settings, name, value) {
  let s = {...settings};
  s[name] = value;
  await MMKV.setStringAsync('settings', JSON.stringify(s));
  updateEvent({type: Actions.SETTINGS, settings: s});
}

export const scrollRef = createRef();
export const AndroidModule = NativeModules.NNativeModule;

export const dirs = RNFetchBlob.fs.dirs;
export const ANDROID_PATH = dirs.SDCardDir + '/Notesnook/';
export const IOS_PATH = dirs.DocumentDir;

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
  sortOrder: defaultState.settings.sortOrder,
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
  console.log(event.nativeEvent);
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
  dHeight = size.height
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
  EXPIRED: 0,
  TRIAL: 1,
  ACTIVE: 2,
  ACTIVE_RENEWING: 3,
  CANCELLED: 4,
};

export const SUBSCRIPTION_STATUS_STRINGS = {
  0: "Expired",
  1: "Trial",
  2: "Pro",
  3: "Pro",
  4: "Cancelled",
};

