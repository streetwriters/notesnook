import { createRef, MutableRefObject, RefObject } from 'react';
import { Platform } from 'react-native';
import WebView from 'react-native-webview';
import { sleep } from '../../../utils/time';
import { getResponse, randId, textInput } from './utils';

type Action = { job: string; id: string };

async function call(webview: RefObject<WebView | undefined>, action?: Action) {
  if (!webview || !action) return;
  setImmediate(() => webview.current?.injectJavaScript(action.job));
  let response = await getResponse(action.id);
  console.log('webview job: ', action.id, response ? response.value : response);
  if (!response) {
    console.warn('webview job failed', action.id, action.job);
  }
  return response ? response.value : response;
}

const fn = (fn: string) => {
  let id = randId('fn_');
  return {
    job: `(async () => {
      try {
        let response = true;
        ${fn}
        post("${id}",response);
      } catch(e) {
        logger('error', "webview: ", e.message, e.stack);
      }
    })();`,
    id: id
  };
};

class Commands {
  ref = createRef<WebView | undefined>();
  constructor(ref: MutableRefObject<WebView | undefined>) {
    this.ref = ref;
  }

  focus = async () => {
    if (!this.ref) return;
    if (Platform.OS === 'android') {
      this.ref.current?.requestFocus();
      setTimeout(async () => {
        if (!this.ref) return;
        textInput.current?.focus();
        this.ref?.current?.requestFocus();
        await call(this.ref, fn(`editor.commands.focus()`));
      }, 1);
    } else {
      await sleep(200);
      await call(this.ref, fn(`editor.commands.focus()`));
    }
  };

  blur = async () => await call(this.ref, fn(`editor.commands.blur();editorTitle.current?.blur()`));

  clearContent = async () => {
    await call(
      this.ref,
      fn(
        `
editor.commands.blur();
editorTitle.current?.blur();
editor?.commands.clearContent(false);
editorController.setTitle(null);
statusBar.current.set({date:"",saved:""});
        `
      )
    );
  };

  setSessionId = async (id: string | null) =>
    await call(this.ref, fn(`globalThis.sessionId = "${id}"`));

  setStatus = async (date: string | undefined, saved: string) =>
    await call(this.ref, fn(`statusBar.current.set({date:"${date}",saved:"${saved}"})`));

  setPlaceholder = async (placeholder: string) => {
    await call(
      this.ref,
      fn(`
    const element = document.querySelector(".is-editor-empty");
    if (element) {
      element.setAttribute("data-placeholder","${placeholder}");
    }
    `)
    );
  };
}

export default Commands;
