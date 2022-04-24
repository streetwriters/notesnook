import { DDS } from '../../services/device-detection';
import { eSendEvent } from '../../services/event-manager';
import { NotesScreenParams } from '../../services/navigation';
import { editing } from '../../utils';
import { db } from '../../utils/database';
import { eOnLoadNote } from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import { tabBarRef } from '../../utils/global-refs';
import { getNote } from '../editor/Functions';

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
    if (getNote()) {
      eSendEvent(eOnLoadNote, { type: 'new' });
      editing.currentlyEditing = true;
      editing.movedAway = false;
    }
    tabBarRef.current?.goToPage(1);
  } else {
    eSendEvent(eOnLoadNote, { type: 'new' });
  }
}

export const setOnFirstSave = (
  data: {
    type: string;
    id: string;
    notebook?: string;
    color?: string;
  } | null
) => {
  //@ts-ignore
  editing.actionAfterFirstSave = data;
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
