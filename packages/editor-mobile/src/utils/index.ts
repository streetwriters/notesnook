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

import { Editor, ToolbarGroupDefinition } from "@notesnook/editor";
import { ThemeDefinition } from "@notesnook/theme";
import { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import { EditorController } from "../hooks/useEditorController";

import { EditorEvents } from "./editor-events";

globalThis.sessionId = "notesnook-editor";
globalThis.pendingResolvers = {};

globalThis.pendingResolvers = {};

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
  doubleSpacedLines?: boolean;
  corsProxy: string;
  fontSize: number;
  fontFamily: string;
  timeFormat: string;
  dateFormat: string;
  fontScale: number;
  markdownShortcuts: boolean;
};

/* eslint-disable no-var */
declare global {
  var LINGUI_LOCALE: string;
  var LINGUI_LOCALE_DATA: { [name: string]: any };
  var pendingResolvers: {
    [key: string]: (value: any) => void;
  };

  var readonlyEditor: boolean;
  var statusBars: Record<
    string,
    | React.MutableRefObject<{
        set: React.Dispatch<
          React.SetStateAction<{
            date: string;
            saved: string;
          }>
        >;
        updateWords: () => void;
        resetWords: () => void;
      }>
    | undefined
  >;
  var __PLATFORM__: "ios" | "android";
  var readonly: boolean;
  var noToolbar: boolean;
  var noHeader: boolean;
  function toBlobURL(dataurl: string, id?: string): string | undefined;
  var pendingResolvers: { [name: string]: (value: any) => void };

  var commands: any;
  /**
   * Id of current session
   */
  var sessionId: string | undefined;

  var tabStore: any;
  /**
   * Current tiptap editors
   */
  var editors: Record<string, Editor | null>;
  /**
   * Current editor controllers
   */
  var editorControllers: Record<string, EditorController | undefined>;

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

  var editorTitles: Record<string, RefObject<HTMLTextAreaElement> | undefined>;
  /**
   * Global ref to manage tags in editor.
   */
  var editorTags: Record<
    string,
    | MutableRefObject<{
        setTags: React.Dispatch<
          React.SetStateAction<
            { title: string; alias: string; id: string; type: "tag" }[]
          >
        >;
      }>
    | undefined
  >;

  var __DEV__: boolean;

  function logger(type: "info" | "warn" | "error", ...logs: unknown[]): void;
  function dbLogger(type: "log" | "error", ...logs: unknown[]): void;

  function loadApp(): void;
  /**
   * Function to post message to react native
   * @param type
   * @param value
   */

  function post<T extends keyof typeof EditorEvents>(
    type: (typeof EditorEvents)[T],
    value?: unknown,
    tabId?: string,
    noteId?: string,
    sessionId?: string
  ): void;
  interface Window {
    /**
     * React Native WebView
     */
    ReactNativeWebView: {
      postMessage: (data: string) => void;
    };
  }
}

export function getRoot() {
  if (!isReactNative()) return; // Subscribe only in react native webview.
  const isSafari = navigator.vendor.match(/apple/i);
  let root: Document | Window = document;
  if (isSafari) {
    root = window;
  }
  return root;
}

export function getOnMessageListener(callback: () => void) {
  getRoot()?.addEventListener("onMessage", callback);
  return {
    remove: getRoot()?.removeEventListener("onMessage", callback)
  };
}

export function randId(prefix: string) {
  return Math.random()
    .toString(36)
    .replace("0.", prefix || "");
}

export function isReactNative(): boolean {
  return !!window.ReactNativeWebView;
}

export function logger(
  type: "info" | "warn" | "error",
  ...logs: unknown[]
): void {
  if (typeof globalThis.__DEV__ !== "undefined" && !globalThis.__DEV__) return;

  const logString = logs
    .map((log) => {
      return typeof log !== "string" ? JSON.stringify(log) : log;
    })
    .join(" ");

  post(EditorEvents.logger, `[${type}]: ` + logString);
}

export function dbLogger(type: "error" | "log", ...logs: unknown[]): void {
  const logString = logs
    .map((log) => {
      return typeof log !== "string" ? JSON.stringify(log) : log;
    })
    .join(" ");

  post(EditorEvents.dbLogger, {
    message: `[${type}]: ` + logString,
    error: logs[0] instanceof Error ? logs[0] : undefined
  });
}

export function post(
  type: string,
  value?: unknown,
  tabId?: string,
  noteId?: string,
  sessionId?: string,
  hasTimeout?: boolean
): string {
  const id = randId(type);
  if (isReactNative()) {
    setTimeout(() =>
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type,
          value: value,
          sessionId: sessionId || globalThis.sessionId,
          tabId,
          noteId,
          resolverId: id,
          hasTimeout: hasTimeout
        })
      )
    );
  }
  return id;
}

export async function postAsyncWithTimeout<R = any>(
  type: string,
  value?: unknown,
  tabId?: string,
  noteId?: string,
  sessionId?: string,
  waitFor?: number
): Promise<R> {
  return new Promise((resolve, reject) => {
    const id = post(
      type,
      value,
      tabId,
      noteId,
      sessionId,
      waitFor !== undefined ? true : false
    );
    globalThis.pendingResolvers[id] = (result) => {
      delete globalThis.pendingResolvers[id];
      logger("info", `Async post request resolved for ${id}`);
      resolve(result);
    };
    if (waitFor !== undefined) {
      setTimeout(() => {
        if (globalThis.pendingResolvers[id]) {
          delete globalThis.pendingResolvers[id];
          reject(new Error(`Async post request timed out for ${id}`));
        }
      }, waitFor);
    }
  });
}

globalThis.logger = logger;
globalThis.dbLogger = dbLogger;
globalThis.post = post;

export function saveTheme(theme: ThemeDefinition) {
  localStorage.setItem("editor-theme", JSON.stringify(theme));
}

export function getTheme() {
  const json = localStorage.getItem("editor-theme");
  if (json) {
    return JSON.parse(json) as ThemeDefinition;
  }
  return undefined;
}
