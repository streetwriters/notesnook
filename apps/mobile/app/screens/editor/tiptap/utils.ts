import { createRef, MutableRefObject, RefObject } from "react";
import { TextInput } from "react-native";
import WebView from "react-native-webview";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { NoteType } from "../../../utils/types";
import { EditorState, useEditorType } from "./types";
export const textInput = createRef<TextInput>();
export const editorController =
  createRef<useEditorType>() as MutableRefObject<useEditorType>;

export const defaultState: Partial<EditorState> = {
  movedAway: true
};

export function editorState() {
  if (!editorController.current?.state.current) {
    console.warn("Editor state not ready");
  }
  return editorController.current?.state.current || defaultState;
}

export const EditorEvents: { [name: string]: string } = {
  html: "native:html",
  title: "native:title",
  theme: "native:theme",
  titleplaceholder: "native:titleplaceholder",
  logger: "native:logger",
  status: "native:status"
};

export function randId(prefix: string) {
  return Math.random()
    .toString(36)
    .replace("0.", prefix || "");
}

export function makeSessionId(item?: NoteType) {
  return item?.id ? item.id + randId("_session_") : randId("session_");
}

export async function isEditorLoaded(
  ref: RefObject<WebView>,
  sessionId: string
) {
  return await post(ref, sessionId, EditorEvents.status);
}

export async function post<T>(
  ref: RefObject<WebView>,
  sessionId: string,
  type: string,
  value: T | null = null
) {
  if (!sessionId) {
    console.warn("post called without sessionId of type:", type);
    return;
  }
  const message = {
    type,
    value,
    sessionId: sessionId
  };
  setImmediate(() => ref.current?.postMessage(JSON.stringify(message)));
  const response = await getResponse(type);
  console.log("post: ", type, sessionId, "result:", !!response);
  return response;
}

type WebviewResponseData = {
  [name: string]: unknown;
  sessionId: string | null;
  type: string;
  value: unknown;
};

export const getResponse = async (
  type: string
): Promise<WebviewResponseData | false> => {
  return new Promise((resolve) => {
    const callback = (data: WebviewResponseData) => {
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
    content === "" ||
    content.trim() === "" ||
    content === "<p></p>" ||
    content === "<p><br></p>" ||
    content === "<p>&nbsp;</p>"
  );
}
