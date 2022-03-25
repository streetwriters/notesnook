import { createRef } from 'react';
import { Platform } from 'react-native';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../services/event-manager';
import { useEditorStore } from '../../../stores/stores';
import { sleep } from '../../../utils/time';
import commands from './commands';
export const textInput = createRef();

export const EditorEvents = {
  html: 'native:html',
  title: 'native:title',
  theme: 'native:theme',
  titleplaceholder: 'native:titleplaceholder',
  logger: 'native:logger',
  status: 'native:status'
};

function randId(prefix) {
  return Math.random()
    .toString(36)
    .replace('0.', prefix || '');
}

export function makeSessionId(item) {
  return item?.id ? item.id + randId('_session_') : randId('session_');
}

export async function isEditorLoaded(ref) {
  return await post(ref, EditorEvents.status);
}

export async function post(ref, type, value = null) {
  let sessionId = useEditorStore.getState().sessionId;
  if (!sessionId) {
    console.warn('post called without sessionId of type:', type);
    return;
  }
  let message = {
    type,
    value,
    sessionId: sessionId
  };
  ref.current?.postMessage(JSON.stringify(message));
  let response = await getResponse(type);
  console.log('post: ', type, 'result:', response);
  return response;
}

const getResponse = async type => {
  return new Promise(resolve => {
    let callback = data => {
      eUnSubscribeEvent(type, callback);
      resolve(data);
    };
    eSubscribeEvent(type, callback);
    setTimeout(() => {
      resolve(false);
    }, 5000);
  });
};
