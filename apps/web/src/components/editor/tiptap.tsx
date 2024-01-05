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
  TiptapOptions
} from "@notesnook/editor";
import { Flex } from "@theme-ui/components";
import {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from "react";
import { Attachment } from "./picker";
import { IEditor } from "./types";
import {
  useSearch,
  useEditorConfig,
  useToolbarConfig,
  useEditorManager
} from "./manager";
import { createPortal } from "react-dom";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import { debounce } from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import { writeText } from "clipboard-polyfill";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { toBlobURL } from "@notesnook/editor/dist/utils/downloader";

export type OnChangeHandler = (content: () => string) => void;
type TipTapProps = {
  id: string;
  editorContainer: () => HTMLElement | undefined;
  onLoad?: () => void;
  onChange?: OnChangeHandler;
  onContentChange?: () => void;
  onSelectionChange?: (range: { from: number; to: number }) => void;
  onInsertAttachment?: (type: AttachmentType) => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
  onAttachFile?: (file: File) => void;
  onFocus?: () => void;
  content?: () => string | undefined;
  readonly?: boolean;
  nonce?: number;
  isMobile?: boolean;
  downloadOptions?: DownloadOptions;
  fontSize: number;
  fontFamily: string;
};

function updateWordCount(id: string, content: () => Fragment) {
  const fragment = content();
  useEditorManager.getState().updateEditor(id, {
    statistics: {
      words: {
        total: countWords(fragment.textBetween(0, fragment.size, "\n", " ")),
        selected: 0
      }
    }
  });
}

const deferredUpdateWordCount = debounce(updateWordCount, 1000);

function TipTap(props: TipTapProps) {
  const {
    id,
    onSelectionChange,
    onLoad,
    onChange,
    onInsertAttachment,
    onDownloadAttachment,
    onPreviewAttachment,
    onAttachFile,
    onContentChange,
    onFocus = () => {},
    content,
    editorContainer,
    readonly,
    nonce,
    isMobile,
    downloadOptions,
    fontSize,
    fontFamily
  } = props;

  const isUserPremium = useIsUserPremium();
  // const configure = useConfigureEditor();
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
      element: editorContainer(),
      editable: !readonly,
      content: content?.(),
      autofocus: "start",
      onFocus,
      onCreate: ({ editor }) => {
        if (oldNonce.current !== nonce)
          editor.commands.focus("start", { scrollIntoView: true });
        oldNonce.current = nonce;

        console.log("on create new editor");
        useEditorManager.getState().setEditor(id, {
          editor: toIEditor(editor as Editor),
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
          statistics: {
            words: {
              total: getTotalWords(editor as Editor),
              selected: 0
            }
          }
        });
        editor.commands.refreshSearch();

        if (onLoad) onLoad();
      },
      onUpdate: ({ editor, transaction }) => {
        onContentChange?.();

        deferredUpdateWordCount(id, () => editor.state.doc.content);

        const preventSave = transaction?.getMeta("preventSave") as boolean;
        if (preventSave || !editor.isEditable || !onChange) return;

        console.log("CHANGING", onChange);
        onChange(() =>
          getHTMLFromFragment(editor.state.doc.content, editor.schema)
        );
      },
      onDestroy: () => {
        useEditorManager.getState().setEditor(id);
      },
      onTransaction: ({ editor }) => {
        useEditorManager.getState().updateEditor(id, {
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo()
        });
      },
      copyToClipboard(text) {
        writeText(text);
      },
      onSelectionUpdate: debounce(({ editor, transaction }) => {
        const isEmptySelection = transaction.selection.empty;
        if (onSelectionChange) onSelectionChange(transaction.selection);
        useEditorManager.getState().updateEditor(id, (old) => {
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
      }
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

  // useEffect(() => {
  //   if (!editorContainer) return;
  //   const currentEditor = editor;
  //   function onClick(e: MouseEvent) {
  //     if (e.target !== editorContainer || !currentEditor?.state.selection.empty)
  //       return;

  //     const lastNode = currentEditor?.state.doc.lastChild;
  //     const isLastNodeParagraph = lastNode?.type.name === "paragraph";
  //     const isEmpty = lastNode?.nodeSize === 2;
  //     if (isLastNodeParagraph && isEmpty) currentEditor?.commands.focus("end");
  //     else {
  //       currentEditor
  //         ?.chain()
  //         .insertContentAt(currentEditor?.state.doc.nodeSize - 2, "<p></p>")
  //         .focus("end")
  //         .run();
  //     }
  //   }
  //   editorContainer.addEventListener("click", onClick);
  //   return () => {
  //     editorContainer.removeEventListener("click", onClick);
  //   };
  // }, [editor, editorContainer]);

  console.log("RENDERING TIPTAP");

  if (readonly) return null;
  return (
    <>
      <ScopedThemeProvider scope="editorToolbar" sx={{ width: "100%" }}>
        <Toolbar
          editor={editor}
          location={isMobile ? "bottom" : "top"}
          tools={toolbarConfig}
          defaultFontFamily={fontFamily}
          defaultFontSize={fontSize}
        />
      </ScopedThemeProvider>
    </>
  );
}

function TiptapWrapper(
  props: PropsWithChildren<
    Omit<TipTapProps, "editorContainer" | "theme" | "fontSize" | "fontFamily">
  >
) {
  const theme = useThemeStore((store) =>
    store.colorScheme === "dark" ? store.darkTheme : store.lightTheme
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>();
  const { editorConfig } = useEditorConfig();

  useLayoutEffect(() => {
    if (
      !containerRef.current ||
      !editorContainerRef.current ||
      editorContainerRef.current.parentElement === containerRef.current
    )
      return;
    containerRef.current.appendChild(editorContainerRef.current);
  }, []);

  useEffect(() => {
    if (!editorContainerRef.current) return;
    editorContainerRef.current.style.color =
      theme.scopes.editor?.primary?.paragraph ||
      theme.scopes.base.primary.paragraph;
  }, [theme]);

  return (
    <PortalProvider>
      <Flex ref={containerRef} sx={{ flex: 1, flexDirection: "column" }}>
        <TipTap
          {...props}
          editorContainer={() => {
            if (editorContainerRef.current) return editorContainerRef.current;
            const editorContainer = document.createElement("div");
            editorContainer.id = "editor-container";
            editorContainer.classList.add("selectable");
            editorContainer.style.flex = "1";
            editorContainer.style.cursor = "text";
            editorContainer.style.color =
              theme.scopes.editor?.primary?.paragraph ||
              theme.scopes.base.primary.paragraph;
            editorContainer.style.paddingBottom = `150px`;
            editorContainer.style.fontSize = `${editorConfig.fontSize}px`;
            editorContainer.style.fontFamily =
              getFontById(editorConfig.fontFamily)?.font || "sans-serif";
            editorContainerRef.current = editorContainer;
            return editorContainer;
          }}
          fontFamily={editorConfig.fontFamily}
          fontSize={editorConfig.fontSize}
        />
        {props.children}
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
    focus: ({ position, scrollIntoView } = {}) => {
      if (typeof position === "object")
        editor.current?.chain().focus().setTextSelection(position).run();
      else
        editor.current?.commands.focus(position, {
          scrollIntoView
        });
    },
    undo: () => editor.current?.commands.undo(),
    redo: () => editor.current?.commands.redo(),
    getMediaHashes: () => {
      if (!editor.current) return [];
      const hashes: string[] = [];
      editor.current.state.doc.descendants((n) => {
        if (typeof n.attrs.hash === "string") hashes.push(n.attrs.hash);
      });
      return hashes;
    },
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
    attachFile: (file: Attachment) => {
      if (file.dataurl) {
        editor.current?.commands.insertImage({
          ...file,
          bloburl: toBlobURL(file.dataurl, file.hash)
        });
      } else editor.current?.commands.insertAttachment(file);
    },
    loadWebClip: (hash, src) =>
      editor.current?.commands.updateWebClip({ hash }, { src }),
    loadImage: (hash, dataurl) =>
      editor.current?.commands.updateImage(
        { hash },
        { hash, bloburl: toBlobURL(dataurl, hash), preventUpdate: true }
      ),
    sendAttachmentProgress: (hash, type, progress) =>
      editor.current?.commands.setAttachmentProgress({
        hash,
        type,
        progress
      })
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
