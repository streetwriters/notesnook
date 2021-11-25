import {createRef} from 'react';
import {Platform} from 'react-native';
import {presentDialog} from '../../components/Dialog/functions';
import {useEditorStore, useMenuStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import PremiumService from '../../services/PremiumService';
import {editing} from '../../utils';
import {COLORS_NOTE, COLOR_SCHEME} from '../../utils/Colors';
import {hexToRGBA} from '../../utils/ColorUtils';
import {db} from '../../utils/database';
import {
  eOnLoadNote,
  eShowGetPremium,
  eShowMergeDialog
} from '../../utils/Events';
import filesystem from '../../utils/filesystem';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {normalize} from '../../utils/SizeUtils';
import {sleep, timeConverter} from '../../utils/TimeUtils';
import tiny from './tiny/tiny';
import {IMAGE_TOOLTIP_CONFIG} from './tiny/toolbar/config';
import {parse} from 'node-html-parser';

export let EditorWebView = createRef();
export const editorTitleInput = createRef();
export const sourceUri =
  Platform.OS === 'android' ? 'file:///android_asset/' : 'Web.bundle/site/';

let lastEditTime = 0;
let EDITOR_SETTINGS = null;
let webviewOK = true;
let noteEdited = false;
let note = null;
let id = null;
let content = {
  data: '',
  type: 'tiny'
};
let title = '';
let saveCounter = 0;
let timer = null;
let webviewInit = false;
let appColors = COLOR_SCHEME;

let closingSession = false;
let currentEditingTimer = null;
let webviewTimer = null;
let requestedReload = false;
let cTimeout = null;
let disableSaving = false;
let isSaving = false;
let waitForContent = false;
let prevNoteContent = null;

export function startClosingSession() {
  closingSession = true;
}

export function setWebviewInit(init) {
  webviewInit = init;
}

export function getWebviewInit() {
  return webviewInit;
}

export function setColors(colors) {
  if (colors) {
    appColors = colors;
  }
  let theme = {...appColors, factor: normalize(1)};

  if (note && note.color && !DDS.isLargeTablet()) {
    theme.shade = hexToRGBA(COLORS_NOTE[note.color?.toLowerCase()], 0.15);
  }
  tiny.call(EditorWebView, tiny.updateTheme(JSON.stringify(theme)));
}

export function isNotedEdited() {
  return noteEdited;
}

async function waitForEvent(event, caller, onend) {
  return new Promise((resolve, reject) => {
    let resolved;
    let event_callback = () => {
      eUnSubscribeEvent(event, event_callback);
      resolved = true;
      clearTimeout(resolved);
      onend && onend();
      resolve();
    };
    eSubscribeEvent(event, event_callback);
    caller && caller();
    resolved = setTimeout(() => {
      resolve(true);
    }, 2000);
  });
}

export async function clearTimer(clear) {
  clearTimeout(timer);
  timer = null;
  if (waitForContent && noteEdited) {
    await waitForEvent('content_event', () => {
      tiny.call(EditorWebView, request_content);
    });
  }
  waitForContent = false;

  if (clear) {
    if (!id || !noteEdited) return;
    if (
      (content?.data &&
        typeof content.data === 'string' &&
        content.data?.trim().length > 0) ||
      (title && title?.trim().length > 0)
    ) {
      console.log('saving note after edit');
      await saveNote(true);
    }
  }

  if (currentEditingTimer) {
    clearTimeout(currentEditingTimer);
    currentEditingTimer = null;
  }
}

export const CHECK_STATUS = `(function() {
       setTimeout(() => {
        let msg = JSON.stringify({
          data: true,
          type: 'running',
        });
        window.ReactNativeWebView.postMessage(msg)

       },${Platform.OS === 'ios' ? '300' : '1'})
})();`;

const request_content = `(function() {
  if (window.ReactNativeWebView) {
    editor.getHTML().then(function(html) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'tiny',
          value:html,
          caller:"request_content"
        })
      );
    })
  }
})();`;

export function getNote() {
  return note;
}

export function setNoteOnly(n) {
  note = n;
}

export const textInput = createRef();

export function post(type, value = null) {
  let message = {
    type,
    value
  };
  if (type === 'html') {
    console.log('message type', type);
  }

  EditorWebView.current?.postMessage(JSON.stringify(message));
}

export const _onShouldStartLoadWithRequest = async request => {
  if (request.url.includes('https')) {
    if (Platform.OS === 'ios' && !request.isTopFrame) return;
    openLinkInBrowser(request.url, appColors)
      .catch(e => {})
      .then(r => {});

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
  lastEditTime = item.dateEdited;
  if (note.locked) {
    content.data = note.content.data;
    content.type = note.content.type;
  } else {
    let data = await db.content.raw(note.contentId);

    if (!data) {
      content.data = '';
      content.type = 'tiny';
    } else {
      content.data = data.data;
      content.type = data.type;
    }
  }
}

function clearNote() {
  note = null;
  title = '';
  noteEdited = false;
  console.log('closing note id', id);
  prevNoteContent = content.data;
  id = null;
  content = {
    data: '',
    type: 'tiny'
  };
}

export const loadNote = async item => {
  console.log('.....OPEN NOTE.....');
  editing.currentlyEditing = true;
  editing.movedAway = false;

  if (closingSession) {
    eSendEvent('loadingNote', item);
    console.log('waiting item');
    await waitForEvent('session_ended');
    console.log('session ended');
  }
  closingSession = true;
  if (editing.isFocused) {
    tiny.call(EditorWebView, tiny.blur);
  }

  if (item && item.type === 'new') {
    if (getNote()) {
      await clearEditor(true, true, true);
    }
    closingSession = false;
    disableSaving = false;
    lastEditTime = 0;
    clearNote();
    noteEdited = false;
    if (Platform.OS === 'android') {
      await sleep(100);
      textInput.current?.focus();
      EditorWebView.current?.requestFocus();
      tiny.call(EditorWebView, tiny.focusEditor);
    } else {
      await sleep(50);
      tiny.call(EditorWebView, tiny.focusEditor);
    }
    if (EDITOR_SETTINGS) {
      tiny.call(
        EditorWebView,
        EDITOR_SETTINGS.directionality === 'rtl'
          ? `tinymce.activeEditor.execCommand('mceDirectionRTL');`
          : `tinymce.activeEditor.execCommand('mceDirectionLTR');`
      );
    }

    if (!webviewInit) {
      EditorWebView.current?.reload();
    }
    tiny.call(EditorWebView, tiny.notLoading);
    checkStatus();
  } else {
    if (id === item.id && !item.forced) {
      return;
    }
    eSendEvent('loadingNote', item);
    if (getNote()) {
      await clearEditor(true, false, true);
    }
    closingSession = false;
    disableSaving = false;
    noteEdited = false;
    await setNote(item);
    webviewInit = false;
    editing.isFocused = false;
    setTimeout(async () => {
      if (await checkStatus(true)) {
        requestedReload = true;
        EditorWebView.current?.reload();
      } else {
        eSendEvent('webviewreset');
      }
    }, 1);
    useEditorStore.getState().setCurrentlyEditingNote(item.id);
  }
};

const checkStatus = async noreset => {
  return new Promise(resolve => {
    webviewOK = false;
    clearTimeout(webviewTimer);
    webviewTimer = null;
    const onWebviewOk = () => {
      webviewOK = true;
      webviewInit = true;
      clearTimeout(webviewTimer);
      webviewTimer = null;
      resolve(true);
      eUnSubscribeEvent('webviewOk', onWebviewOk);
    };
    eSubscribeEvent('webviewOk', onWebviewOk);
    EditorWebView.current?.injectJavaScript(CHECK_STATUS);

    webviewTimer = setTimeout(() => {
      if (!webviewOK && !noreset) {
        console.log('webview not ok', 'ERROR');
        webviewInit = false;
        EditorWebView = createRef();
        eSendEvent('webviewreset');
        resolve(false);
      }
    }, 1000);
  });
};

export const _onMessage = async evt => {
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
      if (message.value === '<br>') return;
      if (message.value !== content.data) {
        if (prevNoteContent && message.value === prevNoteContent) {
          prevNoteContent = null;
          noteEdited = false;
          return;
        }

        noteEdited = true;
        lastEditTime = Date.now();
        content = {
          type: message.type,
          data: message.value
        };
        onNoteChange();
      }
      if (waitForContent) {
        eSendEvent('content_event');
      }
      break;
    case 'title':
      if (message.value !== title) {
        noteEdited = true;
        lastEditTime = Date.now();
        title = message.value;
        eSendEvent('editorScroll', {
          title: message.value
        });
        onNoteChange();
      }
      break;
    case 'scroll':
      eSendEvent('editorScroll', message);
      break;
    case 'attachment_download':
      filesystem.downloadAttachment(message.value, true);
      break;
    case 'noteLoaded':
      tiny.call(EditorWebView, tiny.notLoading);
      setTimeout(() => {
        eSendEvent('loadingNote');
      },150);
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
          desc: 'Enjoy Full Rich Text Editor with Markdown Support!'
        });
      }
      break;
    case 'status':
      if (!requestedReload && getNote()) return;
      requestedReload = false;
      setColors(COLOR_SCHEME);
      webviewInit = true;
      webviewOK = true;
      if (PremiumService.get()) {
        tiny.call(EditorWebView, tiny.setMarkdown, true);
      } else {
        tiny.call(EditorWebView, tiny.removeMarkdown, true);
      }
      loadNoteInEditor();
      break;
    case 'running':
      eSendEvent('webviewOk');
      webviewOK = true;
      break;
    case 'editorSettings':
      EDITOR_SETTINGS = message.value;
      eSendEvent('editorSettingsEvent', message.value);
      break;
    case 'imagepreview':
      eSendEvent('ImagePreview', message.value);
      break;
    case 'imageoptions':
      if (editing.tooltip === 'imageoptions') {
        eSendEvent('showTooltip');
        break;
      }
      showImageOptionsTooltip();
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

function showImageOptionsTooltip() {
  editing.tooltip = 'imageoptions';
  eSendEvent('showTooltip', IMAGE_TOOLTIP_CONFIG);
}

function onNoteChange() {
  clearTimeout(timer);
  timer = null;
  noteEdited = true;
  timer = setTimeout(() => {
    if (noteEdited) {
      saveNote();
    }
  }, 300);
}

export async function clearEditor(
  clear = true,
  reset = true,
  immediate = false
) {
  closingSession = true;
  tiny.call(EditorWebView, tiny.isLoading);
  if (clear) {
    console.log('clearing content start');
    waitForContent = true;

    await clearTimer(true);
    console.log('clearing content end');
  }
  disableSaving = true;
  db.fs.cancel(getNote()?.id);
  clearNote();
  if (cTimeout) {
    clearTimeout(cTimeout);
    cTimeout = null;
  }
  let func = async () => {
    try {
      reset && EditorWebView.current?.reload();

      editing.focusType = null;
      eSendEvent('historyEvent', {
        undo: 0,
        redo: 0
      });
      saveCounter = 0;
      useEditorStore.getState().setCurrentlyEditingNote(null);
    } catch (e) {
      console.log('reset error', e);
    }
  };
  if (immediate) {
    await func();
  } else {
    cTimeout = setTimeout(func, 500);
  }
  console.log('closing ended');
  eSendEvent('session_ended');
  closingSession = false;
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
          id: editing.actionAfterFirstSave.notebook
        },
        id
      );
      editing.actionAfterFirstSave = {
        type: null
      };
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notebooks,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Notebook
      ]);
      break;
    }
    case 'tag': {
      await db.notes.note(id).tag(editing.actionAfterFirstSave.id);
      editing.actionAfterFirstSave = {
        type: null
      };
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Tags,
        Navigation.routeNames.NotesPage
      ]);
      break;
    }
    case 'color': {
      await db.notes.note(id).color(editing.actionAfterFirstSave.id);

      editing.actionAfterFirstSave = {
        type: null
      };
      Navigation.setRoutesToUpdate([Navigation.routeNames.NotesPage]);
      useMenuStore.getState().setColorNotes();
      break;
    }
    default: {
      break;
    }
  }
}

export async function saveNote(preventUpdate) {
  if (disableSaving || !noteEdited || (isSaving && !id)) return;

  isSaving = true;
  try {
    if (id && !db.notes.note(id)) {
      clearNote();
      return;
    }
    let locked = false;
    if (id) {
      let _note = db.notes.note(id).data;
      if (_note.conflicted) {
        presentResolveConflictDialog(_note);
        return;
      }
      locked = _note.locked;
    }

    let noteData = {
      title,
      content: {
        data: content.data,
        type: content.type
      },
      id: id
    };

    if (!locked) {
      let noteId = await db.notes.add(noteData);
      if (!id || saveCounter < 3) {
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Notebook
        ]);
      }

      if (!id) {
        useEditorStore.getState().setCurrentlyEditingNote(noteId);
        await addToCollection(noteId);
      }
      await setNoteInEditorAfterSaving(id, noteId);
      saveCounter++;
    } else {
      noteData.contentId = note.contentId;
      await db.vault.save(noteData);
    }
    if (!preventUpdate) {
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes
      ]);
      let n = db.notes.note(id)?.data?.dateEdited;
      lastEditTime = n + 10;
      tiny.call(EditorWebView, tiny.updateDateEdited(timeConverter(n)));
      tiny.call(EditorWebView, tiny.updateSavingState('Saved'));
    }
  } catch (e) {
    console.log('note save error', e, e.stack);
  }
  isSaving = false;
}

export async function onWebViewLoad(premium, colors) {
  if (premium) {
    tiny.call(EditorWebView, tiny.setMarkdown, true);
  } else {
    tiny.call(EditorWebView, tiny.removeMarkdown, true);
  }
  if (getNote()?.id) {
    loadNoteInEditor();
  }
  setColors(colors);
}

async function restoreEditorState() {
  let appState = await MMKV.getItem('appState');
  if (appState) {
    appState = JSON.parse(appState);
    if (
      appState.editing &&
      appState.note &&
      !appState.note.locked &&
      appState.note.id &&
      Date.now() < appState.timestamp + 3600000
    ) {
      editing.isRestoringState = true;
      eSendEvent('loadingNote', appState.note);
      editing.currentlyEditing = true;
      if (!DDS.isTab) {
        tabBarRef.current?.goToPage(1);
      }
      setTimeout(() => {
        eSendEvent(eOnLoadNote, appState.note);
      }, 100);
      MMKV.removeItem('appState');
      editing.movedAway = false;
      eSendEvent('load_overlay', 'hide_editor');
      editing.isRestoringState = false;
      return;
    }
    editing.isRestoringState = false;
    return;
  }
  editing.isRestoringState = false;
}

export const presentResolveConflictDialog = _note => {
  presentDialog({
    title: 'Changes not saved',
    paragraph: 'Please resolve conflicts to save changes',
    positiveText: 'Resolve',
    positivePress: () => {
      eSendEvent(eShowMergeDialog, _note);
    }
  });
};

const loadNoteInEditor = async (keepHistory = true) => {
  console.log('loading note', id, webviewInit);

  if (!webviewInit) return;
  saveCounter = 0;
  if (note?.id) {
    post('title', title);
    intent = false;
    if (!content || !content.data || content?.data?.length === 0) {
      tiny.call(
        EditorWebView,
        `
    globalThis.isClearingNoteData = false;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'noteLoaded',
        value: true,
      }),
    );
    `
      );
    } else {
      console.log('opening in editor');
      post('html', content.data);
    }
    if (id) {
      db.attachments.downloadImages(id);
    }

    setColors();
    tiny.call(
      EditorWebView,
      tiny.updateDateEdited(timeConverter(note.dateEdited))
    );
    tiny.call(EditorWebView, tiny.updateSavingState('Saved'));
  } else {
    await restoreEditorState();
  }
  await sleep(500);
  loadingNote = null;
  disableSaving = false;
  if (keepHistory) {
    tiny.call(EditorWebView, tiny.clearHistory);
  }
};

export async function updateNoteInEditor() {
  return;
  let _note = db.notes.note(id).data;
  if (_note.conflicted) {
    presentResolveConflictDialog(_note);
    return;
  }
  let data = await db.content.raw(_note.contentId);
  if (lastEditTime > _note.dateEdited) return;
  if (data.data === content.data) return;
  if (content.data.indexOf(data.data) !== -1) return;
  if (note.dateEdited === _note.dateEdited) return;

  console.log('injecting note in editor', lastEditTime, _note.dateEdited);
  title = note.title;
  content.data = data.data;
  note = _note;
  lastEditTime = _note.dateEdited + 10;
  tiny.call(EditorWebView, tiny.isLoading);
  await setNote(_note);
  tiny.call(EditorWebView, tiny.isLoading);
  post('title', title);
  post('inject', content.data);
  setTimeout(() => {
    tiny.call(EditorWebView, tiny.notLoading);
  }, 50);
  if (id) {
    db.attachments.downloadImages(id);
  }
  tiny.call(EditorWebView, tiny.notLoading);
}
