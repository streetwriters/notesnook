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

import { Editor } from "@notesnook/editor";
import {
  ThemeDefinition,
  useThemeColors,
  useThemeEngineStore
} from "@notesnook/theme";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { EventTypes, isReactNative, post, saveTheme } from "../utils";
import { injectCss, transform } from "../utils/css";
import { useTabContext, useTabStore } from "./useTabStore";

type Attachment = {
  hash: string;
  filename: string;
  mime: string;
  size: number;
};

export type Selection = {
  [name: string]: {
    text?: string;
    length?: number;
    attributes?: Record<string, unknown>;
    type?: "mark" | "node";
  };
};

type Timers = {
  selectionChange: NodeJS.Timeout | null;
  change: NodeJS.Timeout | null;
  wordCounter: NodeJS.Timeout | null;
};

function isInViewport(element: any) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function scrollIntoView(editor: Editor) {
  setTimeout(() => {
    const node = editor?.state.selection.$from;
    const dom = node ? editor?.view?.domAtPos(node.pos) : null;
    let domNode = dom?.node;

    if (domNode) {
      if (domNode.nodeType === Node.TEXT_NODE && domNode.parentNode) {
        domNode = domNode.parentNode;
      }
      if (isInViewport(domNode)) return;
      (domNode as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  }, 100);
}

export type EditorController = {
  selectionChange: (editor: Editor) => void;
  titleChange: (title: string) => void;
  contentChange: (editor: Editor) => void;
  scroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  openFilePicker: (type: "image" | "file" | "camera") => void;
  downloadAttachment: (attachment: Attachment) => void;
  previewAttachment: (attachment: Attachment) => void;
  content: MutableRefObject<string | null>;
  onUpdate: () => void;
  titlePlaceholder: string;
  openLink: (url: string) => boolean;
  setTitlePlaceholder: React.Dispatch<React.SetStateAction<string>>;
  countWords: (ms: number) => void;
  copyToClipboard: (text: string) => void;
};

export function useEditorController(update: () => void): EditorController {
  const tab = useTabContext();
  const setTheme = useThemeEngineStore((store) => store.setTheme);
  const { colors } = useThemeColors("editor");
  const [title, setTitle] = useState("");
  const [titlePlaceholder, setTitlePlaceholder] = useState("Note title");
  const htmlContentRef = useRef<string | null>(null);
  const timers = useRef<Timers>({
    selectionChange: null,
    change: null,
    wordCounter: null
  });

  const selectionChange = useCallback((_editor: Editor) => {}, []);

  const titleChange = useCallback(
    (title: string) => {
      post(EventTypes.contentchange, undefined, tab.id, tab.noteId);
      post(EventTypes.title, title, tab.id, tab.noteId);
    },
    [tab.id, tab.noteId]
  );

  const countWords = useCallback(
    (ms = 300) => {
      if (typeof timers.current.wordCounter === "number")
        clearTimeout(timers.current.wordCounter);
      timers.current.wordCounter = setTimeout(() => {
        console.time("wordCounter");
        statusBars[tab.id]?.current?.updateWords();
        console.timeEnd("wordCounter");
      }, ms);
    },
    [tab.id]
  );

  useEffect(() => {
    injectCss(transform(colors));
  }, [colors]);

  const contentChange = useCallback(
    (editor: Editor) => {
      const currentSessionId = globalThis.sessionId;
      post(EventTypes.contentchange, undefined, tab.id, tab.noteId);
      if (!editor) return;
      if (typeof timers.current.change === "number") {
        clearTimeout(timers.current?.change);
      }
      timers.current.change = setTimeout(() => {
        htmlContentRef.current = editor.getHTML();
        post(
          EventTypes.content,
          htmlContentRef.current,
          tab.id,
          tab.noteId,
          currentSessionId
        );
      }, 300);

      countWords(5000);
    },
    [countWords, tab.id, tab.noteId]
  );

  const scroll = useCallback(
    (_event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      if (!tab) return;
      useTabStore
        .getState()
        .setScrollPosition(tab.id, _event.currentTarget.scrollTop);
    },
    [tab]
  );

  const onUpdate = useCallback(() => {
    update();
  }, [update]);

  const onMessage = useCallback(
    (event: Event & { data?: string }) => {
      if (event?.data?.[0] !== "{") return;
      const message = JSON.parse(event.data);
      const type = message.type;
      const value = message.value;

      if (message.tabId !== tab.id && type !== "native:status") {
        return;
      }

      if (tab.id === message.tabId) {
        logger(
          "info",
          message.type,
          tab.noteId,
          "Focused:",
          tab.id === useTabStore.getState().currentTab
        );
      }

      const editor = editors[tab.id];
      switch (type) {
        case "native:updatehtml": {
          htmlContentRef.current = value;
          if (!editor) break;
          const { from, to } = editor.state.selection;

          editor?.commands.setContent(htmlContentRef.current, false, {
            preserveWhitespace: true
          });

          editor.commands.setTextSelection({
            from,
            to
          });
          countWords();
          break;
        }
        case "native:html":
          // logger("info", "loading html", htmlContentRef.current);
          htmlContentRef.current = value;
          update();
          countWords();
          break;
        case "native:theme":
          setTheme(message.value);
          setTimeout(() => {
            saveTheme(message.value as ThemeDefinition);
          });
          break;
        case "native:title":
          setTitle(value);
          break;
        case "native:titleplaceholder":
          setTitlePlaceholder(value);
          break;
        case "native:status":
          break;
        case "native:keyboardShown":
          if (editor?.current) {
            scrollIntoView(editor?.current as any);
          }
          break;
        default:
          break;
      }
      post(type); // Notify that message was delivered successfully.
    },
    [tab, update, countWords, setTheme]
  );

  useEffect(() => {
    if (!isReactNative()) return; // Subscribe only in react native webview.
    const isSafari = navigator.vendor.match(/apple/i);
    let root: Document | Window = document;
    if (isSafari) {
      root = window;
    }
    root.addEventListener("message", onMessage);

    return () => {
      root.removeEventListener("message", onMessage);
    };
  }, [onMessage]);

  const openFilePicker = useCallback(
    (type: "image" | "file" | "camera") => {
      post(EventTypes.filepicker, type, tab.id, tab.noteId);
    },
    [tab.id, tab.noteId]
  );

  const downloadAttachment = useCallback(
    (attachment: Attachment) => {
      post(EventTypes.download, attachment, tab.id, tab.noteId);
    },
    [tab.id, tab.noteId]
  );
  const previewAttachment = useCallback(
    (attachment: Attachment) => {
      post(EventTypes.previewAttachment, attachment, tab.id, tab.noteId);
    },
    [tab.id, tab.noteId]
  );
  const openLink = useCallback(
    (url: string) => {
      post(EventTypes.link, url, tab.id, tab.noteId);
      return true;
    },
    [tab.id, tab.noteId]
  );

  const copyToClipboard = (text: string) => {
    post(EventTypes.copyToClipboard, text);
  };

  return {
    contentChange,
    selectionChange,
    titleChange,
    scroll,
    title,
    setTitle,
    titlePlaceholder,
    setTitlePlaceholder,
    openFilePicker,
    downloadAttachment,
    previewAttachment,
    content: htmlContentRef,
    openLink,
    onUpdate: onUpdate,
    countWords,
    copyToClipboard
  };
}
