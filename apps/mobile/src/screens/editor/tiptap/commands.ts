import { createRef, MutableRefObject, RefObject } from 'react';
import { Platform } from 'react-native';
import WebView from 'react-native-webview';
import { sleep } from '../../../utils/time';
import { textInput } from './utils';

function call(webview: RefObject<WebView | undefined>, func?: string) {
  if (!webview || !func) return;
  webview.current?.injectJavaScript(func);
}

const fn = (fn: string) => `(() => {
    ${fn}
})();`;

class Commands {
  ref = createRef<WebView | undefined>();
  constructor(ref: MutableRefObject<WebView | undefined>) {
    this.ref = ref;
  }

  focus = async () => {
    if (!this.ref) return;
    if (Platform.OS === 'android') {
      this.ref.current?.requestFocus();
      setTimeout(() => {
        if (!this.ref) return;
        textInput.current?.focus();
        this.ref?.current?.requestFocus();
        call(this.ref, fn(`editor.commands.focus()`));
      }, 1);
    } else {
      await sleep(200);
      call(this.ref, fn(`editor.commands.focus()`));
    }
  };

  blur = () => call(this.ref, fn(`editor.commands.blur();editorTitle.current?.blur()`));

  clearContent = () => {
    this.blur();
    call(
      this.ref,
      fn(
        `editor?.commands.clearContent(false);
editorController.setTitle(null);
statusBar.current.set({date:"",saved:""});
        `
      )
    );
  };

  setSessionId = (id: string | null) => call(this.ref, fn(`globalThis.sessionId = "${id}"`));

  setStatus = (date: string | undefined, saved: string) =>
    call(this.ref, fn(`statusBar.current.set({date:"${date}",saved:"${saved}"})`));
}

export default Commands;
