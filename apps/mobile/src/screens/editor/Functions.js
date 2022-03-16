import { createRef } from 'react';
import { Platform } from 'react-native';
import { presentDialog } from '../../components/dialog/functions';
import { useEditorStore, useMenuStore, useTagStore } from '../../stores/stores';
import { DDS } from '../../services/device-detection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/event-manager';
import Navigation from '../../services/navigation';
import PremiumService from '../../services/premium';
import { TipManager } from '../../services/tip-manager';
import { editing } from '../../utils';
import { COLORS_NOTE, COLOR_SCHEME } from '../../utils/color-scheme';
import { hexToRGBA } from '../../utils/color-scheme/utils';
import { db } from '../../utils/database';
import {
  eClearEditor,
  eOnLoadNote,
  eOpenTagsDialog,
  eShowGetPremium,
  eShowMergeDialog
} from '../../utils/events';
import filesystem from '../../utils/filesystem';
import { openLinkInBrowser } from '../../utils/functions';
import { MMKV } from '../../utils/database/mmkv';
import { tabBarRef } from '../../utils/global-refs';
import { normalize } from '../../utils/size';
import { sleep, timeConverter } from '../../utils/time';
import umami from '../../utils/analytics';
import { TableCellProperties } from './TableCellProperties';
import { TableRowProperties } from './TableRowProperties';
import tiny from './tiny/tiny';
import { IMAGE_TOOLTIP_CONFIG, TABLE_TOOLTIP_CONFIG } from './tiny/toolbar/config';

export let EditorWebView = createRef();
export const editorTitleInput = createRef();
export const sourceUri = Platform.OS === 'android' ? 'file:///android_asset/' : 'Web.bundle/site/';

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
let webviewTimer = null;
let requestedReload = false;
let disableSaving = false;
let isSaving = false;
let waitForContent = false;
let prevNoteContent = null;
let sessionId = null;
let historySessionId = null;
let placeholderTip = TipManager.placeholderTip();

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
  let theme = { ...appColors, factor: normalize(1) };

  if (note && note.color && !DDS.isLargeTablet()) {
    theme.shade = hexToRGBA(COLORS_NOTE[note.color?.toLowerCase()], 0.15);
  }
  tiny.call(EditorWebView, tiny.updateTheme(JSON.stringify(theme)));
}

export function isNotedEdited() {
  return noteEdited;
}

async function waitForEvent(event, caller, onend) {
  return new Promise(resolve => {
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

export async function clearTimer() {
  if (waitForContent && noteEdited) {
    await waitForEvent('content_event', () => {
      console.log('requested content from edtior');
      tiny.call(EditorWebView, request_content);
    });
  }
  waitForContent = false;
}

export const CHECK_STATUS = `(function() {
        let msg = JSON.stringify({
          data: true,
          type: 'running',
          sessionId:sessionId
        });
        window.ReactNativeWebView.postMessage(msg)
        
})();`;

const request_content = `(function() {
  if (window.ReactNativeWebView) {
    if (!editor) return;
    editor.getHTML().then(function(html) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'tiny',
          value:html,
          caller:"request_content",
          sessionId:sessionId
        })
      );
    }).catch(console.log)
  }
})();`;

export function getNote() {
  return note;
}

export function setReadOnly(readonly) {
  note.readonly = readonly;
}

export function setNoteOnly(n) {
  note = n;
}

export function disableEditing() {
  noteEdited = false;
  disableSaving = true;
}

export const textInput = createRef();

export function post(type, value = null) {
  let message = {
    type,
    value,
    sessionId: sessionId
  };
  if (type === 'html') {
  }

  EditorWebView.current?.postMessage(JSON.stringify(message));
}

export const _onShouldStartLoadWithRequest = async request => {
  if (request.url.includes('https')) {
    if (Platform.OS === 'ios' && !request.isTopFrame) return;
    openLinkInBrowser(request.url, appColors).catch(console.log).then(console.log);

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
      data = await db.content.insertPlaceholders(data, 'placeholder.svg');
      content.data = data.data;
      content.type = data.type;
    }
  }
}

function clearNote() {
  note = null;
  title = '';
  noteEdited = false;
  historySessionId = null;
  prevNoteContent = content.data;
  isSaving = false;
  id = null;
  content = {
    data: '',
    type: 'tiny'
  };
}

function randId(prefix) {
  return Math.random()
    .toString(36)
    .replace('0.', prefix || '');
}

function makeSessionId(item) {
  sessionId = item?.id ? item.id + randId('_session_') : randId('session_');
}
let loading_queue;
let loading_note = false;
export const loadNote = async item => {
  if (loading_note && id) {
    loading_queue = item;
    check_session_status();
    return;
  } else {
    loading_queue = null;
  }

  loading_note = true;
  editing.currentlyEditing = true;
  editing.movedAway = false;

  if (closingSession) {
    console.log('open note:', 'closing: ', closingSession);
    eSendEvent('loadingNote', item);
    await waitForEvent('session_ended');
  }

  closingSession = true;
  if (editing.isFocused) {
    tiny.call(EditorWebView, tiny.blur);
  }
  if (item && item.type === 'new') {
    if (getNote()) {
      eSendEvent('loadingNote', item);
      await clearEditor();
    }
    umami.pageView('/first-note', '/welcome/home');
    clearNote();
    eSendEvent('loadingNote');
    eSendEvent('updateTags');
    useEditorStore.getState().setReadonly(false);
    closingSession = false;
    disableSaving = false;
    lastEditTime = 0;
    noteEdited = false;
    loading_queue = null;
    makeSessionId(item);
    useEditorStore.getState().setSessionId(sessionId);
    await checkStatus(false);
    tiny.call(
      EditorWebView,
      `
    toggleNode(".tag-bar-parent","hide"); 
    clearNode(".tag-bar")`
    );

    if (Platform.OS === 'android') {
      EditorWebView.current?.requestFocus();
      setTimeout(() => {
        textInput.current?.focus();
        EditorWebView.current?.requestFocus();
        tiny.call(EditorWebView, tiny.focusEditor);
      }, 200);
    } else {
      await sleep(200);
      tiny.call(EditorWebView, tiny.focusEditor);
    }

    if (EDITOR_SETTINGS) {
      console.log('settings are present');
      tiny.call(
        EditorWebView,
        EDITOR_SETTINGS.directionality === 'rtl'
          ? `tinymce.activeEditor.execCommand('mceDirectionRTL');`
          : `tinymce.activeEditor.execCommand('mceDirectionLTR');`
      );
    }
    requestedReload = true;
    updateSessionStatus();
    tiny.call(EditorWebView, tiny.notLoading + tiny.toogleReadMode('design'));
  } else {
    if (id === item.id && !item.forced) {
      console.log('note is already opened in editor');
      closingSession = false;
      loading_note = false;
      eSendEvent('loadingNote');
      await checkStatus();
      return;
    }
    eSendEvent('loadingNote', item);
    if (getNote()) {
      await clearEditor();
    }

    closingSession = false;
    disableSaving = false;
    noteEdited = false;
    webviewInit = false;
    editing.isFocused = false;
    useEditorStore.getState().setReadonly(item.readonly);
    await setNote(item);
    if (loading_queue && (loading_queue?.id !== item?.id || loading_queue?.type === 'new')) {
      clearNote();
      loading_note = false;
      loadNote(loading_queue);

      return;
    }
    // tiny.call(
    //   EditorWebView,
    //   `toggleNode(".tag-bar-parent","show");
    // clearNode(".tag-bar")`
    // );
    makeSessionId(item);
    useEditorStore.getState().setSessionId(sessionId);
    webviewInit = true;
    await loadNoteInEditor();
    requestedReload = true;
    if (await checkStatus(false)) {
      updateSessionStatus();
    }
    setTimeout(() => {
      useEditorStore.getState().setCurrentlyEditingNote(item.id);
    }, 1);
  }

  loading_note = false;
};

export const checkStatus = async noreset => {
  return new Promise(resolve => {
    webviewOK = false;
    console.log('checking status of webview');
    clearTimeout(webviewTimer);
    webviewTimer = null;
    const onWebviewOk = () => {
      webviewOK = true;
      webviewInit = true;
      clearTimeout(webviewTimer);
      webviewTimer = null;
      console.log('webviewOk:', webviewOK);
      resolve(true);
      eUnSubscribeEvent('webviewOk', onWebviewOk);
    };
    eSubscribeEvent('webviewOk', onWebviewOk);
    setTimeout(
      () => {
        EditorWebView.current?.injectJavaScript(CHECK_STATUS);
      },
      Platform.OS === 'ios' ? 300 : 1
    );

    webviewTimer = setTimeout(() => {
      console.log('webviewOK:', webviewOK, 'Reset blocked:', noreset);
      if (!webviewOK && !noreset) {
        webviewInit = false;
        console.log('full reset');
        EditorWebView = createRef();
        eSendEvent('webviewreset');
        resolve(true);
      }
    }, 1000);
  });
};

function updateSessionStatus() {
  tiny.call(
    EditorWebView,
    `(function () {
    sessionId = '${sessionId}';
    reactNativeEventHandler('status', true);
  })();`
  );
}

function isContentInvalid(content) {
  return (
    !content ||
    content === '' ||
    content.trim() === '' ||
    content === '<p></p>' ||
    content === '<p><br></p>' ||
    content === '<p>&nbsp;</p>' ||
    content === `<p><br data-mce-bogus="1"></p>`
  );
}

function check_session_status() {
  tiny.call(
    EditorWebView,
    `(function () {
      if (window.ReactNativeWebView) {
        if (!editor) return;
    
        editor.getHTML().then(function (value) {
          let status =
            !value ||
            value === '' ||
            value.trim() === '' ||
            value === '<p></p>' ||
            value === '<p><br></p>' ||
            value === '<p>&nbsp;</p>' ||
            value === '<p><br data-mce-bogus="1"></p>';
    
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'content_not_loaded',
              value: status,
              sessionId: sessionId
            })
          );
        }).catch(console.log)
      }
    })();`
  );
}

export const _onMessage = async evt => {
  if (!evt || !evt.nativeEvent || !evt.nativeEvent.data) return;
  let message = evt.nativeEvent.data;
  let user;
  try {
    message = JSON.parse(message);
  } catch (e) {
    return;
  }
  switch (message.type) {
    case 'tinyerror':
      console.log('tinyerror', message.value);
      ToastEvent.error(message.value, 'Error saving note', 'global');
      break;
    case 'tableconfig':
      showTableOptionsTooltip();
      break;
    case 'tablecelloptions':
      TableCellProperties.present(message.value);
      break;
    case 'tablerowoptions':
      TableRowProperties.present(message.value);
      break;
    case 'selectionvalue':
      eSendEvent('selectionvalue', message.value);
      break;
    case 'history':
      eSendEvent('historyEvent', message.value);
      break;
    case 'noteedited':
      if (message.sessionId !== sessionId) return;
      console.log('noteedited');
      noteEdited = true;
      break;
    case 'tiny':
      if (message.sessionId !== sessionId) return;
      if (prevNoteContent && message.value === prevNoteContent) {
        prevNoteContent = null;
        noteEdited = false;
        return;
      }
      prevNoteContent = null;
      console.log('tiny content recieved', message.caller);
      noteEdited = true;
      lastEditTime = Date.now();
      content = {
        type: message.type,
        data: message.value
      };
      onNoteChange(message.caller ? 0 : 300);
      if (waitForContent) {
        eSendEvent('content_event');
      }
      break;
    case 'title':
      if (message.sessionId !== sessionId) return;
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
      eSendEvent('loadingNote');
      break;
    case 'premium':
      user = await db.user.getUser();
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
      if (sessionId !== message.sessionId) {
        if (!sessionId) makeSessionId({ id });
        updateSessionStatus();
        return;
      }

      if (!requestedReload && getNote()) {
        check_session_status();
        return;
      }
      requestedReload = false;
      setColors(COLOR_SCHEME);
      eSendEvent('webviewOk');
      loading_note = false;
      webviewInit = true;
      webviewOK = true;
      setTimeout(() => {
        if (PremiumService.get()) {
          tiny.call(EditorWebView, tiny.setMarkdown, true);
        } else {
          tiny.call(EditorWebView, tiny.removeMarkdown, true);
        }
      }, 300);
      setTimeout(() => {
        check_session_status();
      }, 1500);
      break;
    case 'content_not_loaded':
      loading_note = false;
      if (isContentInvalid(content.data)) return;
      if (message.sessionId !== sessionId) {
        requestedReload = true;
        updateSessionStatus();
        return;
      }
      if (!id) return;

      if (message.value) {
        console.log('content not loaded', content.data);
        await checkStatus();
        console.log('reloading');
        await loadNoteInEditor();
        setTimeout(() => {
          check_session_status();
        }, 1500);
      }
      break;
    case 'running':
      eSendEvent('webviewOk');
      webviewOK = true;
      break;
    case 'resetcomplete':
      console.log('reset event recieved');
      eSendEvent('resetcomplete');
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
    case 'notetag':
      if (message.value) {
        let _tag = JSON.parse(message.value);
        console.log(_tag.title);
        await db.notes.note(note.id).untag(_tag.title);
        useTagStore.getState().setTags();
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Tags
        ]);
      }
      break;
    case 'newtag':
      if (!getNote()) {
        ToastEvent.show({
          heading: 'Create a note first'
        });
        return;
      }
      eSendEvent(eOpenTagsDialog, note);
      break;
    default:
      break;
  }
};

function showImageOptionsTooltip() {
  editing.tooltip = 'imageoptions';
  eSendEvent('showTooltip', IMAGE_TOOLTIP_CONFIG);
}

function showTableOptionsTooltip() {
  editing.tooltip = 'tableconfig';
  console.log('showTooltip');
  eSendEvent('showTooltip', TABLE_TOOLTIP_CONFIG);
}

function onNoteChange(wait = 300) {
  clearTimeout(timer);
  timer = null;
  noteEdited = false;
  let params = [title, id, content.data, content.type, sessionId, historySessionId];
  timer = setTimeout(() => {
    if (!params[1]) {
      params[1] = id;
    }
    saveNote(...params);
  }, wait);
}

export async function clearEditor() {
  try {
    console.log('closing session: ', closingSession);
    closingSession = true;
    await sleep(100);
    console.log('note edited: ', noteEdited);
    if (noteEdited) {
      console.log('note is edited');
      disableSaving = false;
      waitForContent = true;
      await clearTimer(true);
      await sleep(100);
    }

    disableSaving = true;
    sessionId = null;
    noteEdited = false;
    db.fs.cancel(getNote()?.id);
    clearNote();
    placeholderTip = TipManager.placeholderTip();
    tiny.call(EditorWebView, tiny.reset(placeholderTip));
    //EditorWebView.current?.reload();
    await waitForEvent('resetcomplete');
    editing.focusType = null;
    eSendEvent('historyEvent', {
      undo: 0,
      redo: 0
    });
    saveCounter = 0;
    useEditorStore.getState().setCurrentlyEditingNote(null);
  } catch (e) {}

  disableSaving = false;
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
      Navigation.setRoutesToUpdate([Navigation.routeNames.Tags, Navigation.routeNames.NotesPage]);
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

export async function saveNote(title, _id, data, type, _sessionId, _historySessionId) {
  console.log('saving note:', disableSaving, isSaving, _id, id);
  if (typeof data !== 'string') return;
  if (disableSaving || (isSaving && !id)) return;
  if (_sessionId !== sessionId) {
    noteEdited = false;
  }
  isSaving = true;
  try {
    if (_id && !db.notes.note(_id)) {
      clearNote();
      useEditorStore.getState().setCurrentlyEditingNote(null);
      return;
    }
    let locked = false;
    if (_id) {
      let _note = db.notes.note(_id).data;
      if (_note.readonly) return;
      if (_note.conflicted) {
        presentResolveConflictDialog(_note);
        return;
      }
      locked = _note.locked;
    }

    if (isContentInvalid(data) || !_historySessionId) {
      _historySessionId = note?.dateEdited || Date.now();
      historySessionId = _historySessionId;
      console.log('new session begins');
    }

    console.log('compare ids:', _sessionId === sessionId, _historySessionId === historySessionId);
    console.log(sessionId, historySessionId);
    let noteData = {
      title,
      content: {
        data: data,
        type: type
      },
      id: _id,
      sessionId: isContentInvalid(data) ? null : _historySessionId
    };

    console.log(
      'Note Saved:::',
      'historySessionId:',
      _historySessionId,
      'preventUpdate: ',
      sessionId === _sessionId
    );

    if (!locked) {
      let noteId = await db.notes.add(noteData);
      if (!_id || saveCounter < 3) {
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Notebook
        ]);
      }
      if (!_id) {
        id = noteId;
        await addToCollection(noteId);
      }

      if (!_id && sessionId === _sessionId) {
        if (!title || title === '') {
          console.log('posting title now');
          post('titleplaceholder', db.notes.note(noteId)?.data?.title || '');
        }

        await setNoteInEditorAfterSaving(_id, noteId);
        saveCounter++;
        setTimeout(() => {
          useEditorStore.getState().setCurrentlyEditingNote(noteId);
        });
      }
      _id = noteId;
    } else {
      noteData.contentId = note.contentId;
      await db.vault.save(noteData);
    }
    if (sessionId === _sessionId) {
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes
      ]);

      lastEditTime = n + 10;
      let n = db.notes.note(_id)?.data?.dateEdited;
      tiny.call(
        EditorWebView,
        tiny.updateDateEdited(n ? timeConverter(n) : '') + tiny.updateSavingState(!n ? '' : 'Saved')
      );
    }
  } catch (e) {
    if (e.message === 'ERR_VAULT_LOCKED') {
      console.log(e);
      presentDialog({
        input: true,
        inputPlaceholder: 'Enter vault password',
        title: 'Unlock note',
        paragraph: 'To save note, unlock it',
        positiveText: 'Unlock',
        positivePress: async password => {
          if (password && password.trim()) {
            try {
              await db.vault.unlock(password);
              noteEdited = true;
              onNoteChange(0);
            } catch (e) {
              console.log(e);
              return false;
            }
          } else {
            return false;
          }
        },
        negativeText: 'Cancel',
        onClose: () => {
          noteEdited = false;
          eSendEvent(eClearEditor);
        }
      });
    }
    console.log(e);
    ToastEvent.show({
      heading: 'Error saving note',
      message: e.message,
      type: 'error'
    });
  }
  isSaving = false;
}

export async function onWebViewLoad(premium, colors) {
  eSendEvent('resetcomplete');
  setTimeout(() => {
    if (PremiumService.get()) {
      tiny.call(EditorWebView, tiny.setMarkdown, true);
    } else {
      tiny.call(EditorWebView, tiny.removeMarkdown, true);
    }
  }, 300);
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
  console.log(webviewInit, 'ready?');
  if (!webviewInit) return;
  try {
    if (note?.id) {
      eSendEvent('updateTags');
      post('title', title);

      if (!content || !content.data || content?.data?.length === 0) {
        tiny.call(
          EditorWebView,
          `
        sessionId = "${sessionId}"
    globalThis.isClearingNoteData = false;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'noteLoaded',
        value: true,
        sessionId:sessionId
      }),
    );
    `
        );
      } else {
        console.log('posting html');
        post('html', {
          data: content.data,
          readOnly: note.readonly
        });
      }
      if (id) {
        db.attachments.downloadImages(id);
      }

      setColors();
      tiny.call(
        EditorWebView,
        tiny.updateDateEdited(timeConverter(note.dateEdited)) + tiny.updateSavingState('Saved')
      );
    } else {
      tiny.call(EditorWebView, tiny.toogleReadMode('design'));
      await restoreEditorState();
    }

    if (keepHistory) {
      tiny.call(EditorWebView, tiny.clearHistory);
    }
  } catch (e) {}

  disableSaving = false;
  check_session_status();
};

export async function updateNoteInEditor() {
  return;
  // let _note = db.notes.note(id).data;
  // if (_note.conflicted) {
  //   presentResolveConflictDialog(_note);
  //   return;
  // }
  // let data = await db.content.raw(_note.contentId);
  // if (lastEditTime > _note.dateEdited) return;
  // if (data.data === content.data) return;
  // if (content.data.indexOf(data.data) !== -1) return;
  // if (note.dateEdited === _note.dateEdited) return;

  // title = note.title;
  // content.data = data.data;
  // note = _note;
  // lastEditTime = _note.dateEdited + 10;
  // tiny.call(EditorWebView, tiny.isLoading);
  // await setNote(_note);
  // tiny.call(EditorWebView, tiny.isLoading);
  // post('title', title);
  // post('inject', content.data);
  // setTimeout(() => {
  //   tiny.call(EditorWebView, tiny.notLoading);
  // }, 50);
  // if (id) {
  //   db.attachments.downloadImages(id);
  // }
  // tiny.call(EditorWebView, tiny.notLoading);
}
