import {createRef} from 'react';
import {Linking, Platform} from 'react-native';
import {updateEvent} from '../../components/DialogManager/recievers';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import {eOnNoteEdited, refreshNotesPage} from '../../utils/Events';
import {editing} from '../../utils';
import {sleep, timeConverter} from "../../utils/TimeUtils";
import {normalize} from "../../utils/SizeUtils";
import {db} from "../../utils/DB";

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
let note = {};
let id = null;
let content = null;
let title = null;
let saveCounter = 0;
let canSave = false;
let timer = null;

export function isNotedEdited() {
    return noteEdited;
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

export async function loadNote(item) {
    editing.currentlyEditing = true;
    if (item && item.type === 'new') {
        await clearEditor();
        post('focusTitle');
        canSave = true;
    } else {
        note = item;
        canSave = false;
        eSendEvent(eOnNoteEdited + item.id, {id: item.id});
        await onWebViewLoad();
    }
    noteEdited = false;
}

const onChange = (data) => {
    if (!data || data === '') return;
    let rawData = JSON.parse(data);
    if (rawData.type === 'content') {
        if (
            !id && rawData.text !== "" ||
            (content &&
                JSON.stringify(content.delta) !== JSON.stringify(rawData.delta))
        ) {

            noteEdited = true;

        }
        content = rawData;
    } else {
        if (!id || (rawData.value !== '' && rawData.value !== title)) {
            noteEdited = true;
        }
        title = rawData.value;
    }

};

export const _onMessage = async (evt) => {
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
            if (noteEdited) {
                saveNote(true);
            } else {
            }
        }, 500);
    }
};

export async function clearEditor() {
    if (noteEdited) {
        await saveNote(true);
    }
    if (note && note.id) {
        eSendEvent(eOnNoteEdited + note.id, {id: note.id, closed: true});
    }
    noteEdited = false;
    title = null;
    content = null;
    note = null;
    id = null;
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

export async function saveNote() {
    if (!checkIfContentIsSavable()) return;
    let lockedNote = id ? db.notes.note(id).data.locked : null;

    if (!lockedNote) {
        let rId = await db.notes.add({
            title,
            content: {
                text: content.text,
                delta: content.delta,
            },
            id: id,
        });
        await setNoteInEditorAfterSaving(id, rId);
        if (saveCounter < 3) {
            updateEvent({
                type: Actions.NOTES,
            });
            eSendEvent(refreshNotesPage);
        }

        eSendEvent(eOnNoteEdited + rId, {id: rId});




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
