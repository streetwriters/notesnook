import { DDS } from '../../services/device-detection';
import { eSendEvent } from '../../services/event-manager';
import Navigation, { NotesScreenParams } from '../../services/navigation';
import { useMenuStore } from '../../stores/use-menu-store';
import { db } from '../../utils/database';
import { eOnLoadNote } from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import { tabBarRef } from '../../utils/global-refs';
import { editorController, editorState } from '../editor/tiptap/utils';

export function toCamelCase(title: string) {
  return title.slice(0, 1).toUpperCase() + title.slice(1);
}

export function getAlias(params: NotesScreenParams) {
  if (!params) return '';
  const { item } = params;
  let alias =
    item.type === 'tag'
      ? db.tags?.alias(item.id)
      : item.type === 'color'
      ? db.colors?.alias(item.id)
      : params?.title;
  return alias || '';
}

export function openMonographsWebpage() {
  try {
    openLinkInBrowser('https://docs.notesnook.com/monographs/');
  } catch (e) {}
}

export function openEditor() {
  if (!DDS.isTab) {
    if (editorController.current?.note) {
      eSendEvent(eOnLoadNote, { type: 'new' });
      editorState().currentlyEditing = true;
      editorState().movedAway = false;
    }
    tabBarRef.current?.goToPage(1);
  } else {
    eSendEvent(eOnLoadNote, { type: 'new' });
  }
}

type FirstSaveData = {
  type: string;
  id: string;
  notebook?: string;
  color?: string;
};

export const setOnFirstSave = (
  data: {
    type: string;
    id: string;
    notebook?: string;
    color?: string;
  } | null
) => {
  if (!data) {
    editorState().onNoteCreated = null;
    return;
  }
  //@ts-ignore
  editorState().onNoteCreated = onNoteCreated(id, data);
};

export function isSynced(params: NotesScreenParams) {
  if (params.item.type === 'topic') {
    console.log(params.item.type);
    let topic = db.notebooks?.notebook(params.item.notebookId)?.topics.topic(params.item.id);
    console.log(topic?.synced(), 'sycned');
    return !topic ? true : topic?.synced();
  }
  return true;
}

async function onNoteCreated(id: string, params: FirstSaveData) {
  if (!params) return;

  switch (params.type) {
    case 'topic': {
      await db.notes?.move(
        {
          topic: params.id,
          id: params.notebook
        },
        id
      );
      editorState().onNoteCreated = null;
      Navigation.queueRoutesForUpdate(
        'TaggedNotes',
        'ColoredNotes',
        'TopicNotes',
        'Favorites',
        'Notes',
        'Notebook'
      );
      break;
    }
    case 'tag': {
      await db.notes?.note(id).tag(params.id);
      editorState().onNoteCreated = null;
      Navigation.queueRoutesForUpdate(
        'TaggedNotes',
        'ColoredNotes',
        'TopicNotes',
        'Favorites',
        'Notes'
      );
      eSendEvent('updateTags');
      break;
    }
    case 'color': {
      await db.notes?.note(id).color(params.color);
      editorState().onNoteCreated = null;
      Navigation.queueRoutesForUpdate(
        'TaggedNotes',
        'ColoredNotes',
        'TopicNotes',
        'Favorites',
        'Notes'
      );
      useMenuStore.getState().setColorNotes();
      break;
    }
    default: {
      break;
    }
  }
}
