import {createRef} from 'react';
import {Linking, Platform} from 'react-native';
import {normalize} from '../../common/common';
import {updateEvent} from '../../components/DialogManager/recievers';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {refreshNotesPage} from '../../services/events';
import {db, editing, sleep, timeConverter} from '../../utils/utils';

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

export function isNotedEdited() {
  return noteEdited;
}

export const INJECTED_JAVASCRIPT = (premium, noMenu) =>
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

var note = {};

export function getNote() {
  return note;
}

var id = null;
var content = null;
var title = null;
var saveCounter = 0;
var canSave = false;
var timer = null;

export function post(type, value = null) {
  let message = {
    type,
    value,
  };
  EditorWebView.current?.postMessage(JSON.stringify(message));
}

export const _onShouldStartLoadWithRequest = (request) => {
  if (request.url.includes('https')) {
    Linking.openURL(request.url);
    return false;
  } else {
    return true;
  }
};

export function checkNote() {
  return note && note.id;
}

export async function loadNote(item) {
  editing.currentlyEditing = true;
  updateEvent({type: ACTIONS.NOTES});
  if (item && item.type === 'new') {
    await clearEditor();
    post('focusTitle');
    canSave = true;
  } else {
    note = item;
    canSave = false;
    updateEvent({
      type: ACTIONS.CURRENT_EDITING_NOTE,
      id: item.id,
    });
    await onWebViewLoad();
  }
}

const onChange = (data) => {
  if (!data || data === '') return;
    let rawData = JSON.parse(data);
    console.log(rawData);
    
    if (rawData.type === 'content') {
      if (
        !content ||
        (content &&
          JSON.stringify(content.delta) !== JSON.stringify(rawData.delta))
      ) {
        noteEdited = true;
      }
      content = rawData;
    } else {
      if (rawData.value !== '' && rawData.value !== title) {
        noteEdited = true;
      }
      title = rawData.value;
    }
  
};

export const _onMessage = async (evt) => {
  console.log(evt.nativeEvent.data);
  if (!evt || !evt.nativeEvent || !evt.nativeEvent.data) return;
  let message = evt.nativeEvent.data;

  if (message === 'loaded') {
  } else if (message !== '' && message !== 'loaded') {
    clearTimeout(timer);

    timer = null;
    if (!canSave) {
      await sleep(2000);
      canSave = true;
    }
    onChange(message);
    timer = setTimeout(() => {
      console.log('noteEdited', noteEdited);
      if (noteEdited) {
        saveNote(true);
      } else {
        console.log('NOTHING CHANGED');
      }
    }, 500);
  }
};

export async function clearEditor() {
  await saveNote(true);
  title = null;
  content = null;
  note = null;
  id = null;
  tapCount = 0;
  saveCounter = 0;
  canSave = false;
  post('reset');
}

function checkIfContentIsSavable() {
  if (!canSave) return false;
  if (!title && !content) return false;
  if (content && content.text.length < 2 && title && title?.length < 2)
    return false;
  if (!content && title && title.length < 2) return false;
  if (!title && content.text.length < 2) return false;
  if (title && !content) {
    content = {
      text: '',
      delta: {ops: []},
    };
  }

  return true;
}

async function setNoteInEditorAferSaving(oldId, currentId) {
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

export async function saveNote(lockNote = true) {
  if (!checkIfContentIsSavable()) return;

  let lockedNote = id ? db.notes.note(id).data.locked : null;
  post('saving', 'Saving');

  if (!lockedNote) {
    let rId = await db.notes.add({
      title,
      content: {
        text: content.text,
        delta: content.delta,
      },
      id: id,
    });
    setNoteInEditorAferSaving(id, rId);
    if (content.text.length < 200 || saveCounter < 2) {
      updateEvent({
        type: ACTIONS.NOTES,
      });
      eSendEvent(refreshNotesPage);
    }

    if (id) {
      await addToCollection(id);
      updateEvent({
        type: ACTIONS.CURRENT_EDITING_NOTE,
        id: id,
      });
    }
    saveCounter++;
  } else {
    await db.vault.save({
      title,
      content: {
        text: content.text,
        delta: content.delta,
      },
      id: id,
    });
  }
  let n = db.notes.note(id).data.dateEdited;
  post('dateEdited', timeConverter(n));
  post('saving', 'Saved');
}

export async function onWebViewLoad(noMenu, premium, colors) {
  EditorWebView.current?.injectJavaScript(INJECTED_JAVASCRIPT(premium, false));

  await loadNoteInEditor();
  let theme = {...colors, factor: normalize(1)};
  post('theme', theme);
  await sleep(1000);
  if (!checkNote()) {
    Platform.OS === 'android' ? EditorWebView.current?.requestFocus() : null;
  }
  post('blur');
}

const loadNoteInEditor = async () => {
  saveCounter = 0;
  content = {};
  content.text = '';
  if (note?.id) {
    title = note.title;
    id = note.id;
    content.text = await db.notes.note(id).text();
    post('dateEdited', timeConverter(note.dateEdited));
    await sleep(50);
    post('title', title);
    content.delta = note.content.delta;
    console.log(content.delta, 'DELTA');
    if (!note.locked) {
      content.delta = await db.notes.note(id).delta();
    }
    post('delta', content.delta);
  } else {
    post('focusTitle');
  }
  await sleep(50);
  post('clearHistory');
};
