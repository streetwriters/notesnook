import { createRef, RefObject } from 'react';
import { TextInput } from 'react-native';
import WebView from 'react-native-webview';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../services/event-manager';
import { NoteType } from '../../../utils/types';
import { EditorState, useEditorType } from './types';
export const textInput = createRef<TextInput>();
export const editorController = createRef<useEditorType>();

export const defaultState: Partial<EditorState> = {
  movedAway: true
};

export function editorState() {
  if (!editorController.current?.state.current) {
    console.warn('Editor state not ready');
  }
  return editorController.current?.state.current || defaultState;
}

export const EditorEvents: { [name: string]: string } = {
  html: 'native:html',
  title: 'native:title',
  theme: 'native:theme',
  titleplaceholder: 'native:titleplaceholder',
  logger: 'native:logger',
  status: 'native:status'
};

export function randId(prefix: string) {
  return Math.random()
    .toString(36)
    .replace('0.', prefix || '');
}

export function makeSessionId(item?: NoteType) {
  return item?.id ? item.id + randId('_session_') : randId('session_');
}

export async function isEditorLoaded(ref: RefObject<WebView>, sessionId: string) {
  return await post(ref, sessionId, EditorEvents.status);
}

export async function post(ref: RefObject<WebView>, sessionId: string, type: string, value = null) {
  if (!sessionId) {
    console.warn('post called without sessionId of type:', type);
    return;
  }
  let message = {
    type,
    value,
    sessionId: sessionId
  };
  setImmediate(() => ref.current?.postMessage(JSON.stringify(message)));
  let response = await getResponse(type);
  console.log('post: ', type, sessionId, 'result:', !!response);
  return response;
}

type WebviewResponseData = {
  [name: string]: any;
  sessionId: string | null;
  type: string;
  value: any;
};

export const getResponse = async (type: string): Promise<WebviewResponseData | false> => {
  return new Promise(resolve => {
    let callback = (data: WebviewResponseData) => {
      eUnSubscribeEvent(type, callback);
      resolve(data);
    };
    eSubscribeEvent(type, callback);
    setTimeout(() => {
      resolve(false);
    }, 5000);
  });
};

export function isContentInvalid(content: string | undefined) {
  return (
    !content ||
    content === '' ||
    content.trim() === '' ||
    content === '<p></p>' ||
    content === '<p><br></p>' ||
    content === '<p>&nbsp;</p>'
  );
}
