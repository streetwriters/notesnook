import {createRef} from 'react';
import {Platform} from 'react-native';
import {presentDialog} from '../../components/Dialog/functions';
import {useEditorStore, useMenuStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import PremiumService from '../../services/PremiumService';
import {editing, InteractionManager} from '../../utils';
import {COLORS_NOTE, COLOR_SCHEME} from '../../utils/Colors';
import {hexToRGBA} from '../../utils/ColorUtils';
import {db} from '../../utils/DB';
import {
  eOnLoadNote,
  eShowGetPremium,
  eShowMergeDialog,
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {normalize} from '../../utils/SizeUtils';
import {sleep, timeConverter} from '../../utils/TimeUtils';
import tiny from './tiny/tiny';

export let EditorWebView = createRef();
export const editorTitleInput = createRef();
export const sourceUri =
  Platform.OS === 'android' ? 'file:///android_asset/' : 'Web.bundle/site/';

let EDITOR_SETTINGS = null;
let webviewOK = true;
let noteEdited = false;
let note = null;
let id = null;
let content = {
  data: '',
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

export async function clearTimer(clear) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    if (clear) {
      if (
        (content?.data &&
          typeof content.data == 'string' &&
          content.data?.trim().length > 0) ||
        (title && title?.trim().length > 0 && id)
      ) {
        console.log('saving note now');
        await saveNote(true);
      }
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

       },100)
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
    value,
  };
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
  id = null;
  content = {
    data: '',
    type: 'tiny',
  };
}

let currentEditingTimer = null;

let webviewTimer = null;

export const loadNote = async item => {
  editing.currentlyEditing = true;
  editing.movedAway = false;
  if (editing.isFocused) {
  tiny.call(EditorWebView, tiny.blur);
  }
  if (item && item.type === 'new') {
    if (getNote()) {
      await clearEditor();
    }
    clearNote();

    noteEdited = false;
    id = null;
    if (Platform.OS === 'android') {
      await sleep(100);
      textInput.current?.focus();
      EditorWebView.current?.requestFocus();
      tiny.call(EditorWebView, tiny.focusEditor);
    } else {
      tiny.call(EditorWebView, tiny.focusEditor);
    }
    if (EDITOR_SETTINGS) {
      tiny.call(
        EditorWebView,
        EDITOR_SETTINGS.directionality === 'rtl'
          ? `tinymce.activeEditor.execCommand('mceDirectionRTL');`
          : `tinymce.activeEditor.execCommand('mceDirectionLTR');`,
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
    clearTimer();
    await setNote(item);
    webviewInit = false;
    editing.isFocused = false;
    setTimeout(async () => {
      if (await checkStatus(true)) {
        EditorWebView.current?.reload();
      } else {
        eSendEvent('webviewreset');
      }
    }, 1);
    InteractionManager.runAfterInteractions(async () => {
      useEditorStore.getState().setCurrentlyEditingNote(item.id);
    }, 50);
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
      if (message.value !== content.data) {
        noteEdited = true;
        content = {
          type: message.type,
          data: message.value,
        };
        onNoteChange();
      }
      break;
    case 'title':
      if (message.value !== title) {
        noteEdited = true;
        title = message.value;
        eSendEvent('editorScroll', {
          title: message.value,
        });
        onNoteChange();
      }
      break;
    case 'scroll':
      eSendEvent('editorScroll', message);
      break;
    case 'noteLoaded':
      tiny.call(EditorWebView, tiny.notLoading);
      eSendEvent('loadingNote');
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
  eSendEvent('showTooltip', {
    data: [
      {
        format: 'imagepreview',
        type: 'format',
        fullname: 'Image preview',
      },
      {
        format: 'imageResize25',
        text: '25%',
        type: 'format',
        showTitle: false,
        fullname: 'Resize to 25%',
      },
      {
        format: 'imageResize50',
        text: '50%',
        type: 'format',
        showTitle: false,
        fullname: 'Resize to 25%',
      },
      {
        format: 'imageResize100',
        text: '100%',
        type: 'format',
        showTitle: false,
        fullname: 'Resize to 25%',
      },
      {
        format: 'imagefloatleft',
        type: 'format',
        fullname: 'Remove image',
      },
      {
        format: 'imagefloatright',
        type: 'format',
        fullname: 'Image preview',
      },
      {
        format: 'imagefloatnone',
        type: 'format',
        fullname: 'Image preview',
      },
      {
        format: 'removeimage',
        type: 'format',
        fullname: 'Remove image',
      },
    ],
    title: 'imageoptions',
    default: null,
    type: 'imageoptions',
    pageX: 0,
  });
}

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

export async function clearEditor(clear=true) {
  clear && await clearTimer(true);
  try {
    tiny.call(EditorWebView, tiny.reset, true);
    clearNote();
    editing.focusType = null;
    eSendEvent('historyEvent', {
      undo: 0,
      redo: 0,
    });
    saveCounter = 0;
    useEditorStore.getState().setCurrentlyEditingNote(null);
  } catch (e) {
    console.log(e);
  }
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
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notebooks,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Notebook,
      ]);
      break;
    }
    case 'tag': {
      await db.notes.note(note.id).tag(editing.actionAfterFirstSave.id);
      editing.actionAfterFirstSave = {
        type: null,
      };
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Tags,
        Navigation.routeNames.NotesPage,
      ]);
      break;
    }
    case 'color': {
      await db.notes.note(id).color(editing.actionAfterFirstSave.id);

      editing.actionAfterFirstSave = {
        type: null,
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
let isSaving = false;

export async function saveNote(preventUpdate) {
  if (!noteEdited) return;
  if (isSaving && !id) return;
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
        type: content.type,
      },
      id: id,
    };

    if (!locked) {
      let noteId = await db.notes.add(noteData);
      if (!id || saveCounter < 3) {
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Notebook,
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
        Navigation.routeNames.Notes,
      ]);
      let n = db.notes.note(id)?.data?.dateEdited;
      tiny.call(EditorWebView, tiny.updateDateEdited(timeConverter(n)));
      tiny.call(EditorWebView, tiny.updateSavingState('Saved'));
    }
  } catch (e) {}
  isSaving = false;
}

export async function onWebViewLoad(premium, colors) {
  if (premium) {
    tiny.call(EditorWebView, tiny.setMarkdown, true);
  } else {
    tiny.call(EditorWebView, tiny.removeMarkdown, true);
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

const presentResolveConflictDialog = _note => {
  presentDialog({
    title: 'Changes not saved',
    paragraph: 'Please resolve conflicts to save changes',
    positiveText: 'Resolve',
    positivePress: () => {
      eSendEvent(eShowMergeDialog, _note);
    },
  });
};

export async function updateNoteInEditor() {
  console.log('updating note in editor');
  let _note = db.notes.note(id).data;
  if (_note.conflicted) {
    presentResolveConflictDialog(_note);
    return;
  }
  tiny.call(EditorWebView, tiny.isLoading);
  await setNote(_note);
  await loadNoteInEditor();
  console.log('updated note in editor');
}

const loadNoteInEditor = async () => {
  if (!webviewInit) return;
  saveCounter = 0;
  if (note?.id) {
    post('title', title);
    intent = false;

    if (!content || !content.data || content?.data?.length === 0) {
      tiny.call(
        EditorWebView,
        `
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'noteLoaded',
        value: true,
      }),
    );
    `,
      );
    } else {
      post('html', content.data);
    }

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
