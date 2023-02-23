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
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useEditorThemeStore } from "../state/theme";
import { EventTypes, isReactNative, post } from "../utils";

type Attachment = {
  hash: string;
  filename: string;
  type: string;
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
};

export type EditorController = {
  selectionChange: (editor: Editor) => void;
  titleChange: (title: string) => void;
  contentChange: (editor: Editor) => void;
  scroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  openFilePicker: (type: "image" | "file" | "camera") => void;
  downloadAttachment: (attachment: Attachment) => void;
  content: MutableRefObject<string | null>;
  onUpdate: () => void;
  titlePlaceholder: string;
  openLink: (url: string) => boolean;
  setTitlePlaceholder: React.Dispatch<React.SetStateAction<string>>;
};

export function useEditorController(update: () => void): EditorController {
  const [title, setTitle] = useState("");
  const [titlePlaceholder, setTitlePlaceholder] = useState("Note title");
  const htmlContentRef = useRef<string | null>(null);
  const timers = useRef<Timers>({
    selectionChange: null,
    change: null
  });

  const selectionChange = useCallback((_editor: Editor) => {}, []);

  const titleChange = useCallback((title: string) => {
    post(EventTypes.contentchange);
    post(EventTypes.title, title);
  }, []);

  const contentChange = useCallback((editor: Editor) => {
    post(EventTypes.contentchange);
    if (!editor) return;
    if (typeof timers.current.change === "number") {
      clearTimeout(timers.current?.change);
    }
    timers.current.change = setTimeout(() => {
      htmlContentRef.current = editor.getHTML();
      post(EventTypes.content, htmlContentRef.current);
    }, 300);
  }, []);

  const scroll = useCallback(
    (_event: React.UIEvent<HTMLDivElement, UIEvent>) => {},
    []
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
      global.sessionId = message.sessionId;
      switch (type) {
        case "native:updatehtml": {
          htmlContentRef.current = value;
          if (!editor) break;
          const { from, to } = editor.state.selection;
          editor?.commands.setContent(htmlContentRef.current, false, {
            preserveWhitespace: "full"
          });
          editor.commands.setTextSelection({
            from,
            to
          });

          break;
        }
        case "native:html":
          htmlContentRef.current = value;
          update();
          break;
        case "native:theme":
          useEditorThemeStore.getState().setColors(message.value);
          break;
        case "native:title":
          setTitle(value);
          break;
        case "native:titleplaceholder":
          setTitlePlaceholder(value);
          break;
        case "native:status":
          break;
        default:
          break;
      }
      post(type); // Notify that message was delivered successfully.
    },
    [update]
  );

  useEffect(() => {
    if (!isReactNative()) return; // Subscribe only in react native webview.
    const isSafari = navigator.vendor.match(/apple/i);
    let root: Document | Window = document;
    if (isSafari) {
      root = window;
    }
    console.log("recreating messaging");
    root.addEventListener("message", onMessage);

    return () => {
      root.removeEventListener("message", onMessage);
    };
  }, [onMessage]);

  const openFilePicker = useCallback((type) => {
    post(EventTypes.filepicker, type);
  }, []);

  const downloadAttachment = useCallback((attachment: Attachment) => {
    post(EventTypes.download, attachment);
  }, []);

  const openLink = useCallback((url: string) => {
    post(EventTypes.link, url);
    return true;
  }, []);

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
    content: htmlContentRef,
    openLink,
    onUpdate: onUpdate
  };
}
