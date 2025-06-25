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

import { parseInternalLink } from "@notesnook/core";
import { createRef, MutableRefObject, RefObject } from "react";
import { TextInput } from "react-native";
import WebView from "react-native-webview";
import { db } from "../../../common/database";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { eOnLoadNote } from "../../../utils/events";
import { NotesnookModule } from "../../../utils/notesnook-module";
import { AppState, EditorState, useEditorType } from "./types";
import { useTabStore } from "./use-tab-store";
import { NativeEvents } from "@notesnook/editor-mobile/src/utils/native-events";

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
  tabId: string
) {
  return await post(ref, sessionId, tabId, NativeEvents.status);
}

export async function post<T>(
  ref: RefObject<WebView>,
  sessionId: string,
  tabId: string,
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
      eUnSubscribeEvent(type, callback);
      resolve(false);
    }, waitFor);
  });
};

export const waitForEvent = async (
  type: string,
  waitFor = 300
): Promise<any> => {
  return new Promise((resolve) => {
    const callback = (data: any) => {
      eUnSubscribeEvent(type, callback);
      resolve(data);
    };
    eSubscribeEvent(type, callback);
    setTimeout(() => {
      eUnSubscribeEvent(type, callback);
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

const canRestoreAppState = (appState: AppState) => {
  return appState.editing && Date.now() < appState.timestamp + 3600000;
};

let appState: AppState | undefined;
export function setAppState(state: AppState) {
  appState = state;
}
export function getAppState() {
  if (appState && canRestoreAppState(appState)) return appState as AppState;
  const json = NotesnookModule.getAppState();
  if (json) {
    appState = JSON.parse(json) as AppState;
    if (canRestoreAppState(appState)) {
      return appState;
    } else {
      clearAppState();
      return null;
    }
  }
  return null;
}

export function clearAppState() {
  appState = undefined;
  NotesnookModule.setAppState("");
}

export async function openInternalLink(url: string) {
  const data = parseInternalLink(url);
  if (!data?.id) return false;
  if (
    data.id ===
    useTabStore.getState().getNoteIdForTab(useTabStore.getState().currentTab!)
  ) {
    if (data.params?.blockId) {
      setTimeout(() => {
        if (!data.params?.blockId) return;
        editorController.current.commands.scrollIntoViewById(
          data.params.blockId
        );
      }, 150);
    }
    return;
  }

  eSendEvent(eOnLoadNote, {
    item: await db.notes.note(data?.id),
    blockId: data.params?.blockId
  });
}
