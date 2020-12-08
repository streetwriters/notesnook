import {createRef} from 'react';
import {Linking, Platform} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import {updateEvent} from '../../components/DialogManager/recievers';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, sendNoteEditedEvent} from '../../services/EventManager';
import IntentService from '../../services/IntentService';
import {editing} from '../../utils';
import {COLORS_NOTE, COLOR_SCHEME} from '../../utils/Colors';
import {hexToRGBA} from '../../utils/ColorUtils';
import {db} from '../../utils/DB';
import {
  eOnLoadNote,
  eShowGetPremium,
  refreshNotesPage,
} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {sideMenuRef, tabBarRef} from '../../utils/Refs';
import {normalize} from '../../utils/SizeUtils';
import {sleep, timeConverter} from '../../utils/TimeUtils';

export const EditorWebView = createRef();

export const params = 'platform=' + Platform.OS;
export const sourceUri =
  (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
  'Web.bundle/loader.html';
export const injectedJS = ` setTimeout(() => {
  if (!window.location.search) {
    var link = document.getElementById('progress-bar');
     link.href = './site/index.html?${params}';
     link.click();  
   }
},100);   
      `;

let noteEdited = false;
let note = null;
let id = null;
let content = {
  data: [],
  type: 'delta',
};
let title = '';
let saveCounter = 0;
let timer = null;
let webviewInit = false;
let intent = false;
let appColors = COLOR_SCHEME;

export function setIntent() {
  intent = true;
}

export function getIntent() {
  return intent;
}

export function setColors(colors) {
  if (colors) {
    appColors = colors;
  }
  let theme = {...appColors, factor: normalize(1)};

  if (note && note.color && !DDS.isLargeTablet()) {
    theme.shade = hexToRGBA(COLORS_NOTE[note.color], 0.15);
  }
  post('theme', theme);
}

export function isNotedEdited() {
  return noteEdited;
}

export function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (currentEditingTimer) {
    clearTimeout(currentEditingTimer);
    currentEditingTimer = null;
  }
}

export const INJECTED_JAVASCRIPT = (premium) =>
  premium
    ? `(function() {
        setTimeout(() => {
         loadAction(true,${DDS.isLargeTablet()});
     
        },100)
     })();`
    : `(function() {
      setTimeout(() => {
       loadAction(false,${DDS.isLargeTablet()});
      },100)
   })();`;

export function getNote() {
  return note;
}

export const textInput = createRef();

export function post(type, value = null) {
  let message = {
    type,
    value,
  };
  EditorWebView.current?.postMessage(JSON.stringify(message));
}

export const _onShouldStartLoadWithRequest = async (request) => {
  if (request.url.includes('https')) {
    await Linking.openURL(request.url);
    return false;
  } else {
    return true;
  }
};

export function checkNote() {
  return note && note.id;
}

async function setNote(item) {
  note = item;
  saveCounter = 0;
  title = note.title;
  id = note.id;
  noteEdited = false;
  if (note.locked) {
    content.data = note.content.data;
    content.type = note.content.type;
  } else {
    let data = await db.content.raw(note.contentId);
    content.data = data.data;
    content.type = data.type;
  }
}

function clearNote() {
  note = null;
  title = '';
  noteEdited = false;
  id = null;
  content = {
    data: [],
    type: 'delta',
  };
}

let currentEditingTimer = null;

export async function loadNote(item) {
  editing.currentlyEditing = true;
  post('blur');
  if (item && item.type === 'new') {
    intent = false;
    await clearEditor();
    clearNote();
    noteEdited = false;
    id = null;
    if (Platform.OS === 'android') {
      textInput.current?.focus();
      post('focusTitle');
      EditorWebView.current?.requestFocus();
    } else {
      post('focusTitle');
    }
  } else if (item && item.type === 'intent') {
    await clearEditor();
    clearNote();
    id = null;
    intent = true;
    content = {
      data: item.data,
      type: 'delta',
    };
    if (webviewInit) {
      await loadNoteInEditor();
    }
  } else {
    clearTimer();
    await setNote(item);
    sendNoteEditedEvent(item.id);
    await loadNoteInEditor();
    currentEditingTimer = setTimeout(() => {
      updateEvent({type: Actions.CURRENT_EDITING_NOTE, id: item.id});
    }, 500);
  }
}

export function setIntentNote(item) {
  id = null;
  intent = true;
  content = {
    data: item.data,
    type: 'delta',
  };
}

export const _onMessage = async (evt) => {
  if (!evt || !evt.nativeEvent || !evt.nativeEvent.data) return;
  let message = evt.nativeEvent.data;

  try {
    message = JSON.parse(message);
  } catch (e) {
    return;
  }
  switch (message.type) {
    case 'history':
      eSendEvent('historyEvent', message);
      break;
    case 'delta':
      content = message;
      onNoteChange();
      break;
    case 'title':
      noteEdited = true;
      title = message.value;
      eSendEvent('editorScroll', {
        title: message.value,
      });
      onNoteChange();
      break;
    case 'scroll':
      eSendEvent('editorScroll', message);
      break;
    case 'premium':
      eSendEvent(eShowGetPremium, {
        context: 'editor',
        title: 'Get Notesnook Pro',
        desc: 'Enjoy Full Rich Text Editor with Markdown Support!',
      });

      break;
    default:
      break;
  }
};

function onNoteChange() {
  clearTimeout(timer);
  timer = null;

  noteEdited = true;
  timer = setTimeout(() => {
    if (noteEdited) {
      saveNote();
    }
  }, 500);
}

export async function clearEditor() {
  clearTimer();
  post('reset');
  if (noteEdited && id) {
    await saveNote(false);
  }
  updateEvent({type: Actions.CURRENT_EDITING_NOTE, id: null});
  sendNoteEditedEvent(null, true);
  eSendEvent('historyEvent', {
    undo: 0,
    redo: 0,
  });
  saveCounter = 0;
  clearNote();
  intent = false;
}

function checkIfContentIsSavable() {
  if (content.data.length === 0 && title === '') {
    return false;
  }
  return true;
}

async function setNoteInEditorAfterSaving(oldId, currentId) {
  if (oldId !== currentId) {
    id = currentId;
    note = db.notes.note(id);
    if (note) {
      note = note.data;
    } else {
      await sleep(500);
      note = db.notes.note(id);
      if (note) {
        note = note.data;
      }
    }
  }
}

async function addToCollection(id) {
  switch (editing.actionAfterFirstSave.type) {
    case 'topic': {
      await db.notes.move(
        {
          topic: editing.actionAfterFirstSave.id,
          id: editing.actionAfterFirstSave.notebook,
        },
        id,
      );
      editing.actionAfterFirstSave = {
        type: null,
      };
      updateEvent({type: Actions.NOTEBOOKS});
      eSendEvent(refreshNotesPage);
      break;
    }
    case 'tag': {
      await db.notes.note(note.id).tag(editing.actionAfterFirstSave.id);
      editing.actionAfterFirstSave = {
        type: null,
      };

      updateEvent({type: Actions.TAGS});
      eSendEvent(refreshNotesPage);
      break;
    }
    case 'color': {
      await db.notes.note(id).color(editing.actionAfterFirstSave.id);

      editing.actionAfterFirstSave = {
        type: null,
      };
      eSendEvent(refreshNotesPage);
      updateEvent({type: Actions.COLORS});
      break;
    }
    default: {
      break;
    }
  }
}

export async function saveNote(canPost = true) {
  if (!checkIfContentIsSavable()) return;

  if (id && !db.notes.note(id)) {
    clearNote();
    return;
  }
  let lockedNote = id ? db.notes.note(id).data.locked : null;
  if (!lockedNote) {
    let rId = await db.notes.add({
      title,
      content: {
        data: content.data,
        type: content.type,
      },
      id: id,
    });
    if (!id || saveCounter < 3) {
      updateEvent({
        type: Actions.NOTES,
      });
      updateEvent({type: Actions.CURRENT_EDITING_NOTE, id: id});
      eSendEvent(refreshNotesPage);
    }

    sendNoteEditedEvent(rId);
    await setNoteInEditorAfterSaving(id, rId);
    if (id) {
      await addToCollection(id);
      updateEvent({
        type: Actions.CURRENT_EDITING_NOTE,
        id: id,
      });
    }
    saveCounter++;
  } else {
    await db.vault.save({
      title,
      content: {
        type: content.type,
        data: content.data,
      },
      id: id,
    });
  }
  let n = db.notes.note(id).data.dateEdited;
  if (canPost) {
    post('dateEdited', timeConverter(n));
    post('saving', 'Saved');
  }
}

export async function onWebViewLoad(premium, colors, event) {
  EditorWebView.current?.injectJavaScript(INJECTED_JAVASCRIPT(premium, false));
  if (!checkNote()) {
    post('blur');
    Platform.OS === 'android' ? EditorWebView.current?.requestFocus() : null;
  }
  post('blur');
  setColors(colors);
  await loadEditorState();
  await loadNoteInEditor();
  webviewInit = true;
}
async function loadEditorState() {
  if (sideMenuRef.current !== null) {
    if (intent) {
      MMKV.removeItem('appState');
      return;
    }
    let appState = await MMKV.getItem('appState');
    console.log('checking for app state', appState);
    if (appState) {
      appState = JSON.parse(appState);
      if (appState.editing && appState.note && appState.note.id) {
        console.log('loading note in editor');
        eSendEvent(eOnLoadNote, appState.note);
        tabBarRef.current?.goToPage(1);
        MMKV.removeItem('appState');
      }
    }
  } else {
    // Checks intent only when app is loading
    console.log('here checking for intent and waiting');
    IntentService.check((event) => {
      if (event) {
        console.log('I am handling the intent');
        intent = true;
        eSendEvent(eOnLoadNote, event);
        SplashScreen.hide();
      } else {
        eSendEvent('nointent');
      }
    });
  }
}

export let isFromIntent = false;

const loadNoteInEditor = async () => {
  saveCounter = 0;
  if (intent) {
    await sleep(1500);
    post('delta', content.data);
    intent = true;
    await saveNote();
  } else if (note?.id) {
    post('title', title);
    intent = false;
    setColors();
    post('delta', content.data);
    await sleep(100);
    post('dateEdited', timeConverter(note.dateEdited));
  }
  await sleep(50);
  post('clearHistory');
};
