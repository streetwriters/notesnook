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

import { Editor, scrollIntoViewById } from "@notesnook/editor";
import { strings } from "@notesnook/intl";
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
import {
  getRoot,
  isReactNative,
  post,
  postAsyncWithTimeout,
  saveTheme
} from "../utils";
import { injectCss, transform } from "../utils/css";
import { EditorEvents } from "../utils/editor-events";
import { pendingSaveRequests } from "../utils/pending-saves";
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
  scroll: NodeJS.Timeout | null;
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
    try {
      const node = editor?.state.selection.$from;
      const dom = node ? editor?.view?.domAtPos?.(node.pos) : null;
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
    } catch (e) {
      /* empty */
    }
  }, 100);
}

export type EditorController = {
  selectionChange: (editor: Editor) => void;
  titleChange: (title: string) => void;
  contentChange: (editor: Editor, ignoreEdit?: boolean) => void;
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
  getAttachmentData: (attachment: Partial<Attachment>) => Promise<string>;
  updateTab: () => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  getTableOfContents: () => any[];
  scrollIntoView: (id: string) => void;
  passwordInputRef: MutableRefObject<HTMLInputElement | null>;
  focusPassInput: () => void;
  blurPassInput: () => void;
};
export function useEditorController({
  update,
  getTableOfContents,
  scrollTo,
  scrollTop
}: {
  update: (
    scrollTop?: number,
    selection?: { to: number; from: number }
  ) => void;
  getTableOfContents: () => any[];
  scrollTo: (top: number) => void;
  scrollTop: () => number;
}): EditorController {
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const tab = useTabContext();
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const [loading, setLoading] = useState(false);
  const setTheme = useThemeEngineStore((store) => store.setTheme);
  const { colors } = useThemeColors("editor");
  const [title, setTitle] = useState("");
  const [titlePlaceholder, setTitlePlaceholder] = useState(strings.noteTitle());
  const htmlContentRef = useRef<string | null>(null);
  const updateTabOnFocus = useRef(false);
  const timers = useRef<Timers>({
    selectionChange: null,
    change: null,
    wordCounter: null,
    scroll: null
  });

  if (!tabRef.current.session?.noteId && loading) {
    setTimeout(() => {
      if (!tabRef.current.session?.noteId && loading) {
        setLoading(false);
      }
    }, 3000);
  }

  const selectionChange = useCallback((_editor: Editor) => {}, []);

  const titleChange = useCallback(async (title: string) => {
    if (!isReactNative()) return;
    const currentSessionId = globalThis.sessionId;
    post(
      EditorEvents.contentchange,
      undefined,
      tabRef.current.id,
      tabRef.current.session?.noteId
    );
    const params = [
      {
        title
      },
      tabRef.current.id,
      tabRef.current.session?.noteId,
      currentSessionId,
      1000
    ];
    const pendingTitleIds = await pendingSaveRequests.getPendingTitleIds();
    postAsyncWithTimeout(EditorEvents.title, ...params)
      .then(() => {
        if (pendingTitleIds.length) {
          dbLogger(
            "log",
            `Title saved: ${title}, removing ${pendingTitleIds.length} pending requests `
          );
        }
        pendingSaveRequests.removePendingTitlesById(pendingTitleIds);
      })
      .catch((e) => {
        dbLogger("error", e);
        dbLogger(
          "log",
          `Saving title failed, setting pending request ${pendingTitleIds.length}`
        );
        if (params[2]) {
          pendingSaveRequests.setTitle(params);
        }
        const element = document.getElementById("editor-saving-failed-overlay");
        if (element) {
          element.style.display = "flex";
          editors[tabRef.current.id]?.commands?.blur();
          element.focus();
        }
      });
  }, []);

  const countWords = useCallback((ms = 300) => {
    if (typeof timers.current.wordCounter === "number")
      clearTimeout(timers.current.wordCounter);
    timers.current.wordCounter = setTimeout(() => {
      statusBars[tabRef.current.id]?.current?.updateWords();
    }, ms);
  }, []);

  useEffect(() => {
    injectCss(transform(colors));
  }, [colors]);

  const contentChange = useCallback(
    (editor: Editor, ignoreEdit?: boolean) => {
      if (!isReactNative()) return;
      if (editorControllers[tabRef.current.id]?.loading) {
        logger("info", "Edit skipped, tab is in loading state");
        return;
      }
      const currentSessionId = globalThis.sessionId;
      post(
        EditorEvents.contentchange,
        undefined,
        tabRef.current.id,
        tabRef.current.session?.noteId
      );
      if (!editor) return;
      if (typeof timers.current.change === "number") {
        clearTimeout(timers.current?.change);
      }

      timers.current.change = setTimeout(async () => {
        htmlContentRef.current = editor.getHTML();
        const params = [
          {
            html: htmlContentRef.current,
            ignoreEdit: ignoreEdit
          },
          tabRef.current.id,
          tabRef.current.session?.noteId,
          currentSessionId,
          5000
        ];

        const pendingContentIds =
          await pendingSaveRequests.getPendingContentIds();
        postAsyncWithTimeout(EditorEvents.content, ...params)
          .then(() => {
            if (pendingContentIds.length) {
              dbLogger(
                "log",
                `Content saved, removing ${pendingContentIds.length} pending requests`
              );
            }
            pendingSaveRequests.removePendingContentsById(pendingContentIds);
          })
          .catch((e) => {
            dbLogger("error", e);
            dbLogger(
              "log",
              `Saving content failed, setting pending request ${
                pendingContentIds.length + 1
              }`
            );
            if (params[2]) {
              pendingSaveRequests.setContent(params);
            }

            const element = document.getElementById(
              "editor-saving-failed-overlay"
            );
            if (element) {
              element.style.display = "flex";
              element.focus();
            }
          });

        logger("info", "Editor saving content", params[1], params[2]);
      }, 300);

      countWords(5000);
    },
    [countWords]
  );

  const scroll = useCallback(
    (_event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const value = _event.currentTarget.scrollTop;
      if (timers.current.scroll !== null) clearTimeout(timers.current.scroll);
      timers.current.scroll = setTimeout(() => {
        if (
          tabRef.current.session?.noteId &&
          tabRef.current.session?.noteId ===
            useTabStore.getState().getCurrentNoteId()
        ) {
          post(
            EditorEvents.saveScroll,
            {
              scrollTop: value,
              selection: {
                to: editors[tabRef.current.id]?.state.selection.to,
                from: editors[tabRef.current.id]?.state.selection.from
              }
            },
            tabRef.current.id,
            tabRef.current.session?.noteId
          );
        }
      }, 300);
    },
    []
  );

  const onUpdate = useCallback(() => {
    update();
    logger("info", "Updating content...");
  }, [update]);

  useEffect(() => {
    if (tab.session?.locked) {
      htmlContentRef.current = "";
      setLoading(true);
      onUpdate();
    }
  }, [tab.session?.locked, onUpdate]);

  const onMessage = useCallback(
    (event: Event & { data?: string }) => {
      if (event?.data?.[0] !== "{") return;
      const message = JSON.parse(event.data);
      const type = message.type;
      const value = message.value;

      if (message.tabId !== tabRef.current.id && type !== "native:status") {
        return;
      }

      const editor = editors[tabRef.current.id];
      switch (type) {
        case "native:updatehtml": {
          htmlContentRef.current = value.data;
          if (tabRef.current.id !== useTabStore.getState().currentTab) {
            updateTabOnFocus.current = true;
          } else {
            if (!editor) break;
            editor?.commands.setContent(htmlContentRef.current, false, {
              preserveWhitespace: true
            });

            if (value.selection) {
              editor.commands.setTextSelection(value.selection);
            }

            scrollTo?.(value.scrollTop || 0);
            setLoading(false);
            countWords(0);
          }

          break;
        }
        case "native:html":
          if (htmlContentRef.current === value.data) {
            setLoading(false);
            break;
          }
          htmlContentRef.current = value.data;
          logger("info", "LOADING NOTE HTML");
          if (!editor) break;
          update(value.scrollTop, value.selection);
          setTimeout(() => {
            countWords(0);
          }, 300);
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
          if (editor) {
            scrollIntoView(editor as any);
          }
          break;
        case "native:resolve":
          if (pendingResolvers[value.resolverId]) {
            pendingResolvers[value.resolverId](value.data);
          }
          break;
        default:
          break;
      }
      post(type); // Notify that message was delivered successfully.
    },
    [update, setTheme, scrollTo, countWords]
  );

  useEffect(() => {
    getRoot()?.addEventListener("message", onMessage);
    return () => {
      getRoot()?.removeEventListener("message", onMessage);
    };
  }, [onMessage]);

  const openFilePicker = useCallback((type: "image" | "file" | "camera") => {
    post(
      EditorEvents.filepicker,
      type,
      tabRef.current.id,
      tabRef.current.session?.noteId
    );
  }, []);

  const downloadAttachment = useCallback((attachment: Attachment) => {
    post(
      EditorEvents.download,
      attachment,
      tabRef.current.id,
      tabRef.current.session?.noteId
    );
  }, []);
  const previewAttachment = useCallback((attachment: Attachment) => {
    post(
      EditorEvents.previewAttachment,
      attachment,
      tabRef.current.id,
      tabRef.current.session?.noteId
    );
  }, []);
  const openLink = useCallback((url: string) => {
    post(
      EditorEvents.link,
      url,
      tabRef.current.id,
      tabRef.current.session?.noteId
    );
    return true;
  }, []);

  const copyToClipboard = (text: string) => {
    post(EditorEvents.copyToClipboard, text);
  };

  const getAttachmentData = (attachment: Partial<Attachment>) => {
    return postAsyncWithTimeout(EditorEvents.getAttachmentData, {
      attachment
    });
  };

  return {
    getTableOfContents: getTableOfContents,
    scrollIntoView: (id: string) => scrollIntoViewById(id),
    contentChange,
    selectionChange,
    titleChange,
    scroll,
    loading,
    setLoading,
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
    copyToClipboard,
    getAttachmentData,
    updateTab: () => {
      // When the tab is focused, we apply any updates to content that were recieved when
      // the tab was not focused.
      updateTabOnFocus.current = false;
      setTimeout(() => {
        if (!updateTabOnFocus.current) return;
        const editor = editors[tabRef.current.id];
        if (!editor) return;
        const { from, to } = editor.state.selection;
        editor?.commands.setContent(htmlContentRef.current, false, {
          preserveWhitespace: true
        });
        editor.commands.setTextSelection({
          from,
          to
        });
        countWords();
      }, 1);
    },
    passwordInputRef,
    focusPassInput: () => {
      passwordInputRef.current?.focus();
    },
    blurPassInput: () => {
      passwordInputRef.current?.blur();
    }
  };
}
