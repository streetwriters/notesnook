import { ToolbarGroupDefinition } from "notesnook-editor/dist/toolbar/types";
import { Editor } from "notesnook-editor/dist/types";
import { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import { useEditorController } from "../hooks/useEditorController";

export type SafeAreaType = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

export type Settings = {
  readonly: boolean;
  fullscreen: boolean;
  deviceMode: "mobile" | "smallTablet" | "tablet";
  premium: boolean;
  tools: ToolbarGroupDefinition[];
  noToolbar?: boolean;
  noHeader?: boolean;
};

declare global {
  var readonly: boolean;
  var noToolbar: boolean;
  var noHeader: boolean;
  /**
   * Id of current session
   */
  var sessionId: string;
  /**
   * Current tiptap instance
   */
  var editor: Editor | null;
  /**
   * Current editor controller
   */
  var editorController: ReturnType<typeof useEditorController>;

  var settingsController: {
    update: (settings: Settings) => void;
    previous: Settings;
    set?: Dispatch<SetStateAction<Settings>>;
  };

  var premiumController: {
    update: (premium: boolean) => void;
    previous: boolean;
    set?: Dispatch<SetStateAction<boolean>>;
  };

  var safeAreaController: {
    update: (insets: SafeAreaType) => void;
    reset: () => void;
    previous: SafeAreaType;
    set?: Dispatch<
      SetStateAction<{
        top: number;
        bottom: number;
        left: number;
        right: number;
      }>
    >;
  };

  var editorTitle: RefObject<HTMLInputElement>;

  /**
   * Global ref to manage tags in editor.
   */
  var editorTags: MutableRefObject<{
    setTags: React.Dispatch<
      React.SetStateAction<{ title: string; alias: string }[]>
    >;
  }>;

  function logger(type: "info" | "warn" | "error", ...logs: any[]): void;
  /**
   * Function to post message to react native
   * @param type
   * @param value
   */

  function post(type: string, value?: unknown): void;
  interface Window {
    /**
     * React Native WebView
     */
    ReactNativeWebView: {
      postMessage: (data: string) => void;
    };
  }
}

export const timerFn = (
  callback: () => void,
  duration: number,
  timer: NodeJS.Timeout | null
) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(callback, duration);
  return timer;
};

export const EventTypes = {
  selection: "editor-event:selection",
  content: "editor-event:content",
  title: "editor-event:title",
  scroll: "editor-event:scroll",
  history: "editor-event:history",
  newtag: "editor-event:newtag",
  tag: "editor-event:tag",
  filepicker: "editor-event:picker",
  download: "editor-event:download-attachment",
  logger: "native:logger",
  back: "editor-event:back",
  pro: "editor-event:pro",
  monograph: "editor-event:monograph",
  properties: "editor-event:properties",
};

export function isReactNative(): boolean {
  return !!window.ReactNativeWebView;
}

export function logger(type: "info" | "warn" | "error", ...logs: any[]) {
  let logString = logs
    .map((log) => {
      return typeof log !== "string" ? JSON.stringify(log) : log;
    })
    .join(" ");

  post(EventTypes.logger, `[${type}]: ` + logString);
}

export function post(type: string, value?: unknown) {
  if (isReactNative()) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        //@ts-ignore
        type: EventTypes[type] || type,
        value: value,
        sessionId: global.sessionId,
      })
    );
  } else {
    console.log(type, value);
  }
}
globalThis.logger = logger;
globalThis.post = post;
