/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { createRef, MutableRefObject, RefObject } from "react";
import { TextInput } from "react-native";
import WebView from "react-native-webview";
import { MMKV } from "../../../common/database/mmkv";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { AppState, EditorState, useEditorType } from "./types";
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
  updatehtml: "native:updatehtml",
  title: "native:title",
  theme: "native:theme",
  titleplaceholder: "native:titleplaceholder",
  logger: "native:logger",
  status: "native:status",
  keyboardShown: "native:keyboardShown"
};

export function randId(prefix: string) {
  return Math.random()
    .toString(36)
    .replace("0.", prefix || "");
}

export function makeSessionId(id?: string) {
  return id ? id + randId("_session_") : randId("session_");
}

export async function isEditorLoaded(
  ref: RefObject<WebView>,
  sessionId: string,
  tabId: number
) {
  return await post(ref, sessionId, tabId, EditorEvents.status);
}

export async function post<T>(
  ref: RefObject<WebView>,
  sessionId: string,
  tabId: number,
  type: string,
  value: T | null = null,
  waitFor = 300
) {
  if (!sessionId) {
    console.warn("post called without sessionId of type:", type);
    return;
  }
  const message = {
    type,
    value,
    sessionId: sessionId,
    tabId
  };
  setImmediate(() => ref.current?.postMessage(JSON.stringify(message)));
  const response = await getResponse(type, waitFor);
  return response;
}

type WebviewResponseData = {
  [name: string]: unknown;
  sessionId: string | null;
  type: string;
  value: unknown;
};

export const getResponse = async (
  type: string,
  waitFor = 300
): Promise<WebviewResponseData | false> => {
  return new Promise((resolve) => {
    const callback = (data: WebviewResponseData) => {
      eUnSubscribeEvent(type, callback);
      resolve(data);
    };
    eSubscribeEvent(type, callback);
    setTimeout(() => {
      resolve(false);
    }, waitFor);
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

export function getAppState() {
  const json = MMKV.getString("appState");
  if (json) {
    const appState = JSON.parse(json) as AppState;
    if (
      appState.editing &&
      !appState.note?.locked &&
      appState.note?.id &&
      Date.now() < appState.timestamp + 3600000
    ) {
      return appState;
    } else {
      return null;
    }
  }
  return null;
}

export function clearAppState() {
  MMKV.removeItem("appState");
}
