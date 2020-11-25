import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {defaultState} from '../provider/DefaultState';
import {AndroidModule, sortSettings} from '../utils';
import {getColorScheme} from '../utils/ColorUtils';
import {MMKV} from '../utils/mmkv';
import {scale, updateSize} from '../utils/SizeUtils';
import {enabled} from 'react-native-privacy-snapshot';
import {Platform} from 'react-native';
let settings = defaultState.settings;

async function init() {
  scale.fontScale = 1;
  settings = await MMKV.getStringAsync('appSettings');
  if (!settings) {
    settings = defaultState.settings;
    await MMKV.setStringAsync('appSettings', JSON.stringify(settings));
  } else {
    settings = JSON.parse(settings);
  }
  if (settings.fontScale) {
    scale.fontScale = settings.fontScale;
  }
  if (settings.privacyScreen) {
    if (Platform.OS === 'android') {
      AndroidModule.setSecureMode(true);
    } else {
      enabled(true);
    }
  } else {
    if (Platform.OS === 'android') {
      AndroidModule.setSecureMode(false);
    } else {
      enabled(false);
    }
  }
  sortSettings.sort = settings.sort;
  sortSettings.sortOrder = settings.sortOrder;
  updateSize();
  updateEvent({type: Actions.SETTINGS, settings: {...settings}});
  setTheme();
  return;
}

const setTheme = async () => {
  if (settings) {
    let newColors = await getColorScheme(settings.useSystemTheme);
    updateEvent({type: Actions.THEME, colors: newColors});
  }
};

async function set(name, value) {
  settings[name] = value;
  await MMKV.setStringAsync('appSettings', JSON.stringify(settings));
  updateEvent({type: Actions.SETTINGS, settings: settings});
}

function get() {
  return settings;
}

export default {
  init,
  setTheme,
  set,
  get,
};
