import {createRef} from 'react';
import {Linking, Platform} from 'react-native';
import {updateEvent} from '../../components/DialogManager/recievers';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, sendNoteEditedEvent} from '../../services/EventManager';
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
import tiny from './tiny/tiny';

export let EditorWebView = createRef();
export const editorTitleInput = createRef();

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

let webviewOK = true;
let noteEdited = false;
let note = null;
let id = null;
let content = {
  data: [],
  type: 'tiny',
};
let title = '';
let saveCounter = 0;
let timer = null;
let webviewInit = false;
let intent = false;
let appColors = COLOR_SCHEME;

export function setWebviewInit(init) {
  webviewInit = init;
}

export function getWebviewInit() {
  return webviewInit;
}

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
  tiny.call(EditorWebView, tiny.updateTheme(JSON.stringify(theme)));
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

export const CHECK_STATUS = (premium) =>
  `(function() {
       setTimeout(() => {
        let msg = JSON.stringify({
          data: true,
          type: 'running',
        });
        window.ReactNativeWebView.postMessage(msg)

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
    type: 'tiny',
  };
}

let currentEditingTimer = null;

let webviewTimer = null;

export const loadNote = async (item) => {
  editing.currentlyEditing = true;
  tiny.call(EditorWebView, tiny.blur);

  if (item && item.type === 'new') {
    await clearEditor();
    clearNote();
    noteEdited = false;
    id = null;
    await sleep(20);
    if (Platform.OS === 'android') {
      textInput.current?.focus();
      tiny.call(EditorWebView, tiny.focusEditor);
      EditorWebView.current?.requestFocus();
    } else {
      tiny.call(EditorWebView, tiny.focusEditor);
    }
    if (!webviewInit) {
      EditorWebView.current?.reload();
    }
  } else {
    eSendEvent('loadingNote', true);
    editing.isFocused = false;
    clearTimer();
    await setNote(item);
    sendNoteEditedEvent({
      id: id,
    });
    if (webviewInit) {
      await loadNoteInEditor();
    } else {
      EditorWebView.current?.reload();
    }
    updateEvent({type: Actions.CURRENT_EDITING_NOTE, id: item.id});
  }
  checkStatus();
};

const checkStatus = (reset = false) => {
  webviewOK = false;
  EditorWebView.current?.injectJavaScript(CHECK_STATUS());
  clearTimeout(webviewTimer);
  webviewTimer = setTimeout(() => {
    if (!webviewOK) {
      if (!reset) {
        checkStatus(true);
        console.log('checking again');
        return;
      }
      webviewInit = false;
      EditorWebView = createRef();
      eSendEvent('webviewreset');
    } else {
      console.log('webview is running', webviewOK);
    }
  }, 3500);
};

export function setIntentNote(item) {
  id = null;
  intent = true;
  content = {
    data: item.data,
    type: 'tiny',
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
      eSendEvent('historyEvent', message.value);
      break;
    case 'tiny':
      content = {
        type: message.type,
        data: message.value,
      };
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
    case 'noteLoaded':
      eSendEvent('loadingNote', !message.value);
      break;
    case 'premium':
      let user = await db.user.getUser();
      if (user && !user.isEmailConfirmed) {
        await sleep(500);
        PremiumService.showVerifyEmailDialog();
      } else {
        eSendEvent(eShowGetPremium, {
          context: 'editor',
          title: 'Get Notesnook Pro',
          desc: 'Enjoy Full Rich Text Editor with Markdown Support!',
        });
      }
      break;
    case 'status':
      setColors(COLOR_SCHEME);
      webviewInit = true;
      webviewOK = true;
      loadNoteInEditor();

      break;
    case 'running':
      webviewOK = true;
      break;
    case 'focus':
      editing.focusType = message.value;
      break;
    case 'selectionchange':
      eSendEvent('onSelectionChange', message.value);
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
  tiny.call(EditorWebView, tiny.reset, true);
  clearTimer();
  if (noteEdited && id) {
    await saveNote(false);
  }
  updateEvent({type: Actions.CURRENT_EDITING_NOTE, id: null});
  sendNoteEditedEvent({
    id: id,
    forced: true,
  });
  eSendEvent('historyEvent', {
    undo: 0,
    redo: 0,
  });
  saveCounter = 0;
  tiny.call(EditorWebView, tiny.updateDateEdited(''), true);
  tiny.call(EditorWebView, tiny.updateSavingState(''), true);

  clearNote();
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

export async function saveNote() {
  try {
    if (id && !db.notes.note(id)) {
      clearNote();
      return;
    }
    let locked = id ? db.notes.note(id).data.locked : null;

    let noteData = {
      title,
      content: {
        data: content.data,
        type: content.type,
      },
      id: id,
    };

    if (!locked) {
      let noteId = await db.notes.add(noteData);
      if (!id || saveCounter < 3) {
        updateEvent({
          type: Actions.NOTES,
        });
        updateEvent({type: Actions.CURRENT_EDITING_NOTE, id: noteId});
        eSendEvent(refreshNotesPage);
      }

      if (!id) {
        await addToCollection(noteId);
      }
      await setNoteInEditorAfterSaving(id, noteId);
      saveCounter++;
    } else {
      noteData.contentId = note.contentId;
      await db.vault.save(noteData);
    }
    sendNoteEditedEvent({
      id: id,
    });
    let n = db.notes.note(id)?.data?.dateEdited;
    tiny.call(EditorWebView, tiny.updateDateEdited(timeConverter(n)));
    tiny.call(EditorWebView, tiny.updateSavingState('Saved'));
  } catch (e) {
    console.log(e);
  }
}

export async function onWebViewLoad(premium, colors) {
  if (!checkNote()) {
    Platform.OS === 'android' ? EditorWebView.current?.requestFocus() : null;
  }
  setColors(colors);
}

async function restoreEditorState() {
  let appState = await MMKV.getItem('appState');
  if (appState) {
    appState = JSON.parse(appState);
    if (appState.editing && appState.note && appState.note.id) {
      eSendEvent(eOnLoadNote, appState.note);
      if (!appState.movedAway) {
        tabBarRef.current?.goToPage(1);
      }
      MMKV.removeItem('appState');
    }
  }
}

export let isFromIntent = false;

const loadNoteInEditor = async () => {
  if (!webviewInit) return;
  saveCounter = 0;
  if (note?.id) {
    tiny.call(EditorWebView, tiny.setTitle(title));
    intent = false;
    tiny.call(EditorWebView, tiny.html(content.data));
    setColors();
    tiny.call(
      EditorWebView,
      tiny.updateDateEdited(timeConverter(note.dateEdited)),
    );
    tiny.call(EditorWebView, tiny.updateSavingState('Saved'));
  } else {
    await restoreEditorState();
  }
  tiny.call(EditorWebView, tiny.clearHistory);
};
