import {createRef} from 'react';
import {Linking, Platform} from 'react-native';
import {updateEvent} from '../../components/DialogManager/recievers';
import {Actions} from '../../provider/Actions';
import {eSendEvent, sendNoteEditedEvent} from '../../services/EventManager';
import {refreshNotesPage} from '../../utils/Events';
import {editing} from '../../utils';
import {sleep, timeConverter} from '../../utils/TimeUtils';
import {normalize} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {COLORS_NOTE, COLOR_SCHEME} from '../../utils/Colors';
import {hexToRGBA} from '../../utils/ColorUtils';

export const EditorWebView = createRef();

export const params = 'platform=' + Platform.OS;
export const sourceUri =
  (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
  'Web.bundle/loader.html';
export const injectedJS = `if (!window.location.search) {
       var link = document.getElementById('progress-bar');
        link.href = './site/index.html?${params}';
        link.click();  
      }
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
  if (note && note.colors[0]) {
    theme.shade = hexToRGBA(COLORS_NOTE[note.colors[0]], 0.15);
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
}

export const INJECTED_JAVASCRIPT = (premium) =>
  premium
    ? `(function() {
        setTimeout(() => {
         loadAction(true,false);
     
        },100)
     })();`
    : `(function() {
      setTimeout(() => {
       loadAction(false,false);
     
   
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

export async function loadNote(item) {
  editing.currentlyEditing = true;
  post('blur');
  if (item && item.type === 'new') {
    await clearEditor();
    clearNote();
    intent = false;
    noteEdited = false;
    id = null;
    textInput.current?.focus();
    post('focusTitle');
    Platform.OS === 'android' ? EditorWebView.current?.requestFocus() : null;
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
    await setNote(item);
    sendNoteEditedEvent(item.id);
    await loadNoteInEditor();
  }
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
      onNoteChange();
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
  await sleep(500);
  if (noteEdited && id) {
    await saveNote(false);
  }
  sendNoteEditedEvent(null, true);
  eSendEvent('historyEvent', {
    undo: 0,
    redo: 0,
  });
  saveCounter = 0;
  post('reset');
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
      setTimeout(() => {
        note = db.notes.note(id);
        if (note) {
          note = note.data;
        }
      }, 500);
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

      break;
    }
    case 'tag': {
      await db.notes.note(note.id).tag(editing.actionAfterFirstSave.id);
      editing.actionAfterFirstSave = {
        type: null,
      };

      break;
    }
    case 'color': {
      await db.notes.note(id).color(editing.actionAfterFirstSave.id);

      editing.actionAfterFirstSave = {
        type: null,
      };

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

export async function onWebViewLoad(noMenu, premium, colors) {
  EditorWebView.current?.injectJavaScript(INJECTED_JAVASCRIPT(premium, false));
  if (!checkNote()) {
    post('blur');
    Platform.OS === 'android' ? EditorWebView.current?.requestFocus() : null;
  }
  post('blur');
  await sleep(1000);
  let theme = {...colors, factor: normalize(1)};
  appColors = colors;
  post('theme', theme);
  await loadNoteInEditor();
  webviewInit = true;
}

const loadNoteInEditor = async () => {
  saveCounter = 0;
  if (intent) {
    post('delta', content.data);
    await saveNote();
    intent = false;
  } else if (note?.id) {
    post('title', title);
    post('dateEdited', timeConverter(note.dateEdited));
    setColors();
    post('delta', content.data);
  }
  await sleep(50);
  post('clearHistory');
};
