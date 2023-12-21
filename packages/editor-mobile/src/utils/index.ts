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

globalThis.sessionId = "notesnook-editor";

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
};

/* eslint-disable no-var */
declare global {
  var statusBars: Record<
    number,
    | React.MutableRefObject<{
        set: React.Dispatch<
          React.SetStateAction<{
            date: string;
            saved: string;
          }>
        >;
        updateWords: () => void;
      }>
    | undefined
  >;
  var __PLATFORM__: "ios" | "android";
  var readonly: boolean;
  var noToolbar: boolean;
  var noHeader: boolean;
  function toBlobURL(dataurl: string, id?: string): string | undefined;
  /**
   * Id of current session
   */
  var sessionId: string;

  var tabStore: any;
  /**
   * Current tiptap editors
   */
  var editors: Record<number, Editor | null>;
  /**
   * Current editor controllers
   */
  var editorControllers: Record<number, EditorController | undefined>;

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

  var editorTitles: Record<number, RefObject<HTMLTextAreaElement> | undefined>;
  /**
   * Global ref to manage tags in editor.
   */
  var editorTags: Record<
    number,
    | MutableRefObject<{
        setTags: React.Dispatch<
          React.SetStateAction<
            { title: string; alias: string; id: string; type: "tag" }[]
          >
        >;
      }>
    | undefined
  >;

  function logger(type: "info" | "warn" | "error", ...logs: unknown[]): void;
  /**
   * Function to post message to react native
   * @param type
   * @param value
   */

  function post<T extends keyof typeof EventTypes>(
    type: (typeof EventTypes)[T],
    value?: unknown,
    tabId?: number,
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
/* eslint-enable no-var */

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
  fullscreen: "editor-event:fullscreen",
  link: "editor-event:link",
  contentchange: "editor-event:content-change",
  reminders: "editor-event:reminders",
  previewAttachment: "editor-event:preview-attachment",
  copyToClipboard: "editor-events:copy-to-clipboard",
  tabsChanged: "editor-events:tabs-changed",
  showTabs: "editor-events:show-tabs",
  tabFocused: "editor-events:tab-focused"
} as const;

export function isReactNative(): boolean {
  return !!window.ReactNativeWebView;
}

export function logger(
  type: "info" | "warn" | "error",
  ...logs: unknown[]
): void {
  const logString = logs
    .map((log) => {
      return typeof log !== "string" ? JSON.stringify(log) : log;
    })
    .join(" ");

  post(EventTypes.logger, `[${type}]: ` + logString);
}

export function post<T extends keyof typeof EventTypes>(
  type: (typeof EventTypes)[T],
  value?: unknown,
  tabId?: number,
  noteId?: string,
  sessionId?: string
): void {
  if (isReactNative()) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type,
        value: value,
        sessionId: sessionId || globalThis.sessionId,
        tabId,
        noteId
      })
    );
  } else {
    // console.log(type, value);
  }
}

globalThis.logger = logger;
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
