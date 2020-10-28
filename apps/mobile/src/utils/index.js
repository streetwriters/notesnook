import {Dimensions, Platform} from 'react-native';
import {eSendEvent} from '../services/EventManager';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {MMKV} from "./MMKV";
import RNFetchBlob from 'rn-fetch-blob';

export async function setSetting(settings, name, value) {
  let s = {...settings};
  s[name] = value;
  await MMKV.setStringAsync('settings', JSON.stringify(s));
  updateEvent({type: Actions.SETTINGS, settings: s});
}

export const dirs = RNFetchBlob.fs.dirs;
export const ANDROID_PATH  = dirs.SDCardDir + '/Notesnook/';
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
  eSendEvent('showContextMenu', {
    location: {
      x: event.nativeEvent.pageX + 50,
      y: event.nativeEvent.pageY - 10,
    },
    title: title,
  });
}

export const dWidth = Dimensions.get('window').width;
export const dHeight = Dimensions.get('window').height;

export const itemSkus = Platform.select({
  ios: ['com.streetwriters.notesnook.sub.mo'],
  android: ['com.streetwriters.notesnook.sub.mo'],
});
