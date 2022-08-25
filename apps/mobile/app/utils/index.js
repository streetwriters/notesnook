import { AppState, Dimensions, NativeModules, Platform } from 'react-native';
import { beginBackgroundTask, endBackgroundTask } from 'react-native-begin-background-task';
import RNTooltips from 'react-native-tooltips';
import { db } from '../common/database';
import { tabBarRef } from './global-refs';

let prevTarget = null;
let htmlToText;

export const TOOLTIP_POSITIONS = {
  LEFT: 1,
  RIGHT: 2,
  TOP: 3,
  BOTTOM: 4
};

export const sortSettings = {
  sort: 'default',
  /**
   * @type {"desc" | "asc"}
   */
  sortOrder: 'desc'
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

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const AndroidModule = NativeModules.NNativeModule;

export let dWidth = Dimensions.get('window').width;
export let dHeight = Dimensions.get('window').height;

export const InteractionManager = {
  runAfterInteractions: (func, time = 300) => setTimeout(func, time)
};

export function getElevation(elevation) {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: { width: 0.3 * elevation, height: 0.5 * elevation },
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation
  };
}

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
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (res, rej) => {
      try {
        console.log('APP STATE AT SYNC: ', AppState.currentState);
        let result = await cb();
        res(result);
      } catch (e) {
        res(e.message);
      }
    });
  }
}

export function setWidthHeight(size) {
  dWidth = size.width;
  dHeight = size.height;
}

export function getTotalNotes(notebook) {
  if (!notebook || notebook.type === 'header') return 0;
  if (notebook.type === 'topic') {
    if (!notebook.notes) return 0;
    return notebook.notes.length;
  }
  if (!notebook.topics) return 0;
  return notebook.topics.reduce((sum, topic) => {
    let length = topic?.notes ? topic.notes.length : 0;
    return sum + length;
  }, 0);
}

export async function toTXT(note, notitle) {
  let text;
  if (note.locked) {
    text = note.content.data;
  } else {
    text = await db.notes.note(note.id).content();
  }
  htmlToText = htmlToText || require('html-to-text');
  text = htmlToText.convert(text, {
    selectors: [{ selector: 'img', format: 'skip' }]
  });
  if (!notitle) {
    text = `${note.title}\n \n ${text}`;
  }
  return text;
}

export function showTooltip(event, text, position = 2) {
  if (!event._targetInst?.ref?.current) return;
  prevTarget && RNTooltips.Dismiss(prevTarget);
  prevTarget = null;
  prevTarget = event._targetInst.ref.current;
  RNTooltips.Show(prevTarget, tabBarRef.current?.node?.current, {
    text: text,
    tintColor: '#000000',
    corner: Platform.OS === 'ios' ? 5 : 40,
    textSize: 14,
    position: position,
    duration: 1000,
    autoHide: true,
    clickToHide: true
  });
}
