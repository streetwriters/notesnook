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

import "@notesnook/editor/styles/styles.css";
import "@notesnook/editor/styles/katex.min.css";
import "@notesnook/editor/styles/katex-fonts.css";
import "@notesnook/editor/styles/fonts.css";
import {
  Toolbar,
  useTiptap,
  PortalProvider,
  Editor,
  AttachmentType,
  usePermissionHandler,
  getHTMLFromFragment,
  Fragment,
  type DownloadOptions,
  getTotalWords,
  countWords,
  getFontById,
  TiptapOptions,
  Attachment
} from "@notesnook/editor";
import { Box, Flex } from "@theme-ui/components";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { IEditor } from "./types";
import {
  useConfigureEditor,
  useSearch,
  useToolbarConfig,
  configureEditor,
  useEditorConfig
} from "./context";
import { createPortal } from "react-dom";
import { getCurrentPreset } from "../../common/toolbar-config";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import { debounce, debounceWithId } from "@notesnook/common";
import { store as editorstore } from "../../stores/editor-store";
import { ScopedThemeProvider } from "../theme-provider";
import { writeText } from "clipboard-polyfill";
import { useStore as useThemeStore } from "../../stores/theme-store";

type OnChangeHandler = (
  id: string | undefined,
  sessionId: string,
  content: string,
  ignoreEdit: boolean
) => void;
type TipTapProps = {
  editorContainer: HTMLElement;
  onLoad?: () => void;
  onChange?: OnChangeHandler;
  onContentChange?: () => void;
  onInsertAttachment?: (type: AttachmentType) => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
  onGetAttachmentData?: (attachment: Attachment) => Promise<string | undefined>;
  onAttachFile?: (file: File) => void;
  onFocus?: () => void;
  content?: () => string | undefined;
  toolbarContainerId?: string;
  readonly?: boolean;
  nonce?: number;
  isMobile?: boolean;
  downloadOptions?: DownloadOptions;
  fontSize: number;
  fontFamily: string;
};

const SAVE_INTERVAL = IS_TESTING ? 100 : 300;

function save(
  sessionId: string,
  noteId: string | undefined,
  editor: Editor,
  content: Fragment,
  preventSave: boolean,
  ignoreEdit: boolean,
  onChange?: OnChangeHandler
) {
  configureEditor({
    statistics: {
      words: {
        total: countWords(content.textBetween(0, content.size, "\n", " ")),
        selected: 0
      }
    }
  });

  if (preventSave) return;
  const html = getHTMLFromFragment(content, editor.schema);
  onChange?.(noteId, sessionId, html, ignoreEdit);
}

const deferredSave = debounceWithId(save, SAVE_INTERVAL);

function TipTap(props: TipTapProps) {
  const {
    onLoad,
    onChange,
    onInsertAttachment,
    onDownloadAttachment,
    onPreviewAttachment,
    onGetAttachmentData,
    onAttachFile,
    onContentChange,
    onFocus = () => {},
    content,
    toolbarContainerId,
    editorContainer,
    readonly,
    nonce,
    isMobile,
    downloadOptions,
    fontSize,
    fontFamily
  } = props;

  const isUserPremium = useIsUserPremium();
  const configure = useConfigureEditor();
  const doubleSpacedLines = useSettingsStore(
    (store) => store.doubleSpacedParagraphs
  );
  const dateFormat = useSettingsStore((store) => store.dateFormat);
  const timeFormat = useSettingsStore((store) => store.timeFormat);
  const { toolbarConfig } = useToolbarConfig();
  const { isSearching, toggleSearch } = useSearch();

  usePermissionHandler({
    claims: {
      premium: isUserPremium
    },
    onPermissionDenied: (claim) => {
      if (claim === "premium") showBuyDialog();
    }
  });

  const oldNonce = useRef<number>();

  const tiptapOptions = useMemo<Partial<TiptapOptions>>(() => {
    return {
      editorProps: {
        handleKeyDown(view, event) {
          if ((event.ctrlKey || event.metaKey) && event.key === "s")
            event.preventDefault();
        },
        handlePaste: (view, event) => {
          const hasText = event.clipboardData?.types?.some((type) =>
            type.startsWith("text/")
          );
          // we always give preference to text over files & skip any attached
          // files if there is text.
          // TODO: give user an actionable hint to allow them to select what they
          // want to do in such cases.
          if (!hasText && event.clipboardData?.files?.length && onAttachFile) {
            event.preventDefault();
            event.stopPropagation();
            for (const file of event.clipboardData.files) {
              onAttachFile(file);
            }
            return true;
          }
        }
      },
      downloadOptions,
      doubleSpacedLines,
      dateFormat,
      timeFormat,
      isMobile: isMobile || false,
      element: editorContainer,
      editable: !readonly,
      content: content?.(),
      autofocus: "start",
      onFocus,
      onCreate: async ({ editor }) => {
        if (onLoad) onLoad();
        if (oldNonce.current !== nonce)
          editor.commands.focus("start", { scrollIntoView: true });
        oldNonce.current = nonce;

        configure({
          editor: toIEditor(editor as Editor),
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
          toolbarConfig: (await getCurrentPreset()).tools,
          statistics: {
            words: {
              total: getTotalWords(editor as Editor),
              selected: 0
            }
          }
        });
        editor.commands.refreshSearch();
      },
      onUpdate: ({ editor, transaction }) => {
        onContentChange?.();

        const preventSave = transaction.getMeta("preventSave") as boolean;
        const ignoreEdit = transaction.getMeta("ignoreEdit") as boolean;
        const { id, sessionId } = editorstore.get().session;
        const content = editor.state.doc.content;
        deferredSave(
          sessionId,
          sessionId,
          id,
          editor as Editor,
          content,
          preventSave || !editor.isEditable,
          ignoreEdit,
          onChange
        );
      },
      onDestroy: () => {
        configure({
          editor: undefined,
          canRedo: false,
          canUndo: false,
          searching: false,
          statistics: undefined
        });
      },
      onTransaction: ({ editor }) => {
        configure({
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo()
        });
      },
      copyToClipboard(text) {
        writeText(text);
      },
      onSelectionUpdate: debounce(({ editor, transaction }) => {
        const isEmptySelection = transaction.selection.empty;
        configure((old) => {
          const oldSelected = old.statistics?.words?.selected;
          const oldWords = old.statistics?.words.total || 0;
          if (isEmptySelection)
            return oldSelected
              ? {
                  statistics: { words: { total: oldWords, selected: 0 } }
                }
              : old;

          const selectedWords = getSelectedWords(
            editor as Editor,
            transaction.selection
          );
          return {
            statistics: {
              words: {
                total: oldWords,
                selected: selectedWords
              }
            }
          };
        });
      }, 500),
      onOpenAttachmentPicker: (_editor, type) => {
        onInsertAttachment?.(type);
        return true;
      },
      onDownloadAttachment: (_editor, attachment) => {
        onDownloadAttachment?.(attachment);
        return true;
      },
      onPreviewAttachment(_editor, attachment) {
        onPreviewAttachment?.(attachment);
        return true;
      },
      onOpenLink: (url) => {
        window.open(url, "_blank");
        return true;
      },
      getAttachmentData: onGetAttachmentData
    };
  }, [readonly, nonce, doubleSpacedLines, dateFormat, timeFormat]);

  const editor = useTiptap(
    tiptapOptions,
    // IMPORTANT: only put stuff here that the editor depends on.
    [tiptapOptions]
  );

  useEffect(
    () => {
      const isEditorSearching = editor?.storage.searchreplace?.isSearching;
      if (isSearching) editor?.commands.startSearch();
      else if (isEditorSearching) editor?.commands.endSearch();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSearching]
  );

  useEffect(
    () => {
      const isEditorSearching = editor?.storage.searchreplace?.isSearching;
      if (isSearching && !isEditorSearching) toggleSearch();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleSearch, editor?.storage.searchreplace?.isSearching]
  );

  useEffect(() => {
    if (!editorContainer) return;
    const currentEditor = editor;
    function onClick(e: MouseEvent) {
      if (e.target !== editorContainer || !currentEditor?.state.selection.empty)
        return;

      const lastNode = currentEditor?.state.doc.lastChild;
      const isLastNodeParagraph = lastNode?.type.name === "paragraph";
      const isEmpty = lastNode?.nodeSize === 2;
      if (isLastNodeParagraph && isEmpty) currentEditor?.commands.focus("end");
      else {
        currentEditor
          ?.chain()
          .insertContentAt(currentEditor?.state.doc.nodeSize - 2, "<p></p>")
          .focus("end")
          .run();
      }
    }
    editorContainer.addEventListener("click", onClick);
    return () => {
      editorContainer.removeEventListener("click", onClick);
    };
  }, [editor, editorContainer]);

  if (!toolbarContainerId) return null;
  return (
    <>
      <Portal containerId={toolbarContainerId}>
        <ScopedThemeProvider scope="editorToolbar" sx={{ width: "100%" }}>
          <Toolbar
            editor={editor}
            location={isMobile ? "bottom" : "top"}
            tools={toolbarConfig}
            defaultFontFamily={fontFamily}
            defaultFontSize={fontSize}
          />
        </ScopedThemeProvider>
      </Portal>
    </>
  );
}

function TiptapWrapper(
  props: Omit<
    TipTapProps,
    "editorContainer" | "theme" | "fontSize" | "fontFamily"
  >
) {
  const colorScheme = useThemeStore((store) => store.colorScheme);
  const theme = useThemeStore((store) =>
    colorScheme === "dark" ? store.darkTheme : store.lightTheme
  );
  const [isReady, setIsReady] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { editorConfig } = useEditorConfig();
  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <PortalProvider>
      <Flex sx={{ flex: 1, flexDirection: "column" }}>
        {isReady && editorContainerRef.current ? (
          <TipTap
            {...props}
            editorContainer={editorContainerRef.current}
            fontFamily={editorConfig.fontFamily}
            fontSize={editorConfig.fontSize}
          />
        ) : null}
        <Box
          ref={editorContainerRef}
          className="selectable"
          style={{
            flex: 1,
            cursor: "text",
            color:
              theme.scopes.editor?.primary?.paragraph ||
              theme.scopes.base.primary.paragraph, // TODO!
            paddingBottom: 150,
            fontSize: editorConfig.fontSize,
            fontFamily: getFontById(editorConfig.fontFamily)?.font
          }}
        />
      </Flex>
    </PortalProvider>
  );
}
export default TiptapWrapper;

function Portal(props: PropsWithChildren<{ containerId?: string }>) {
  const { containerId, children } = props;
  const container = containerId && document.getElementById(containerId);
  return container ? (
    <>{createPortal(children, container, containerId)}</>
  ) : (
    <>{children}</>
  );
}

function toIEditor(editor: Editor): IEditor {
  return {
    focus: ({ position, scrollIntoView } = {}) =>
      editor.current?.commands.focus(position, {
        scrollIntoView
      }),
    undo: () => editor.current?.commands.undo(),
    redo: () => editor.current?.commands.redo(),
    updateContent: (content) => {
      const { from, to } = editor.state.selection;
      editor.current
        ?.chain()
        .command(({ tr }) => {
          tr.setMeta("preventSave", true);
          return true;
        })
        .setContent(content, false, { preserveWhitespace: true })
        .setTextSelection({
          from,
          to
        })
        .run();
    },
    attachFile: (file: Attachment) =>
      file.type === "image"
        ? editor.current?.commands.insertImage(file)
        : editor.current?.commands.insertAttachment(file),
    sendAttachmentProgress: (hash, progress) =>
      editor.current?.commands.updateAttachment(
        {
          progress
        },
        { query: (a) => a.hash === hash, preventUpdate: true }
      )
  };
}

function getSelectedWords(
  editor: Editor,
  selection: { from: number; to: number; empty: boolean }
): number {
  const selectedText = selection.empty
    ? ""
    : editor.state.doc.textBetween(selection.from, selection.to, "\n", " ");
  return countWords(selectedText);
}
