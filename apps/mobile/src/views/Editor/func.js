import {createRef} from 'react';
import {Linking, Platform} from 'react-native';
import {normalize} from '../../common/common';
import {updateEvent} from '../../components/DialogManager/recievers';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {refreshNotesPage} from '../../services/events';
import {db, editing, timeConverter} from '../../utils/utils';

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

export const INJECTED_JAVASCRIPT = (premium, noMenu) => `(function() {
        setTimeout(() => {
         loadAction(${(premium, noMenu)});
        },100)
     })();`;

var note = {};
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

export const _onShouldStartLoadWithRequest = request => {
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
    updateEditor();
  }
}

const onChange = data => {
  if (data !== '') {
    let rawData = JSON.parse(data);

    if (rawData.type === 'content') {
      content = rawData;
    } else {
      title = rawData.value;
    }
  }
};

export const _onMessage = evt => {
  if (evt.nativeEvent.data === 'loaded') {
  } else if (evt.nativeEvent.data !== '' && evt.nativeEvent.data !== 'loaded') {
    clearTimeout(timer);

    timer = null;
    if (!canSave) {
      setTimeout(() => {
        canSave = true;
      }, 2000);
    }
    onChange(evt.nativeEvent.data);
    timer = setTimeout(() => {
      saveNote(true);
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
  post('clearEditor');
  post('clearTitle');
  post('blur');
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

export function onWebViewLoad(noMenu, premium, colors) {
  EditorWebView.current?.injectJavaScript(
    INJECTED_JAVASCRIPT(premium, false),
  );
  if (note && note.id) {
    updateEditor();
  } else {
    post('focusTitle');
  }
  let c = {...colors};
  c.factor = normalize(1);
  post('theme', c);

  /*  setTimeout(() => {

    if (noMenu) {
      post('nomenu', true);
    } else {
      post('nomenu', false);
    }

  },1000) */
}

const updateEditor = async () => {
  title = note.title;
  id = note.id;
  saveCounter = 0;
  content = {};
  content.text = '';
  try {
    content.text = await db.notes.note(id).text();
    post('dateEdited', timeConverter(note.dateEdited));
  } catch (e) {}

  if (title !== null || title === '') {
    post('title', note.title);
  } else {
    post('clearTitle');
    post('clearEditor');
    post('focusTitle');
  }
  if (content.text === '' && note.content.delta === null) {
    post('clearEditor');
  } else if (note.content.delta) {
    if (typeof note.content.delta !== 'string') {
      content.delta = note.content.delta;
    } else {
      content.delta = await db.notes.note(id).delta();
    }
    post('delta', content.delta);
  } else {
    post('text', content.text);
  }
};
