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
  Attachment,
  getTableOfContents
} from "@notesnook/editor";
import { Flex } from "@theme-ui/components";
import {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from "react";
import { IEditor } from "./types";
import { useEditorConfig, useToolbarConfig, useEditorManager } from "./manager";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import { debounce } from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { getChangedNodes } from "@notesnook/editor/dist/utils/prosemirror";
import { LinkAttributes } from "@notesnook/editor/dist/extensions/link";
import { writeToClipboard } from "../../utils/clipboard";
import { useEditorStore } from "../../stores/editor-store";
import { parseInternalLink } from "@notesnook/core";

export type OnChangeHandler = (
  content: () => string,
  ignoreEdit: boolean
) => void;
type TipTapProps = {
  id: string;
  editorContainer: () => HTMLElement | undefined;
  onLoad?: (editor: IEditor) => void;
  onChange?: OnChangeHandler;
  onContentChange?: () => void;
  onSelectionChange?: (range: { from: number; to: number }) => void;
  onInsertAttachment?: (type: AttachmentType) => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
  onGetAttachmentData?:
    | ((
        attachment: Pick<Attachment, "hash" | "type">
      ) => Promise<string | undefined>)
    | undefined;
  onAttachFiles?: (files: File[]) => void;
  onInsertInternalLink?: (
    attributes?: LinkAttributes
  ) => Promise<LinkAttributes | undefined>;
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
    onGetAttachmentData,
    onAttachFiles,
    onInsertInternalLink,
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
  const markdownShortcuts = useSettingsStore(
    (store) => store.markdownShortcuts
  );
  const { toolbarConfig } = useToolbarConfig();

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
          if (!hasText && event.clipboardData?.files?.length && onAttachFiles) {
            event.preventDefault();
            event.stopPropagation();
            onAttachFiles(Array.from(event.clipboardData.files));
            return true;
          }
        }
      },
      enableInputRules: markdownShortcuts,
      downloadOptions,
      doubleSpacedLines,
      dateFormat,
      timeFormat,
      element: editorContainer(),
      editable: !readonly,
      content: content?.(),
      autofocus: "start",
      onFocus,
      onCreate: async ({ editor }) => {
        if (oldNonce.current !== nonce)
          editor.commands.focus("start", { scrollIntoView: true });
        oldNonce.current = nonce;

        const instance = toIEditor(editor as Editor);
        if (onLoad) onLoad(instance);
        useEditorManager.getState().setEditor(id, {
          editor: instance,
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
          statistics: {
            words: {
              total: getTotalWords(editor as Editor),
              selected: 0
            }
          },
          tableOfContents: getTableOfContents(editor.view.dom)
        });
      },
      onUpdate: ({ editor, transaction }) => {
        const changedHeadings = getChangedNodes(transaction, {
          descend: true,
          predicate: (n) => n.isBlock && n.type.name === "heading"
        });
        if (changedHeadings.length > 0) {
          useEditorManager.getState().updateEditor(id, {
            tableOfContents: getTableOfContents(editor.view.dom)
          });
        }

        onContentChange?.();

        deferredUpdateWordCount(id, () => editor.state.doc.content);

        const preventSave = transaction?.getMeta("preventSave") as boolean;
        const ignoreEdit = transaction.getMeta("ignoreEdit") as boolean;
        if (preventSave || !editor.isEditable || !onChange) return;

        onChange(
          () => getHTMLFromFragment(editor.state.doc.content, editor.schema),
          ignoreEdit
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
      copyToClipboard(text, html) {
        writeToClipboard({ "text/plain": text, "text/html": html });
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
      openAttachmentPicker: onInsertAttachment,
      downloadAttachment: onDownloadAttachment,
      previewAttachment: onPreviewAttachment,
      createInternalLink: onInsertInternalLink,
      getAttachmentData: onGetAttachmentData,
      openLink: (url) => {
        const link = parseInternalLink(url);
        if (link && link.type === "note") {
          useEditorStore.getState().openSession(link.id, {
            activeBlockId: link.params?.blockId || undefined
          });
        } else window.open(url, "_blank");
      }
    };
  }, [
    readonly,
    nonce,
    doubleSpacedLines,
    dateFormat,
    timeFormat,
    markdownShortcuts
  ]);

  const editor = useTiptap(
    tiptapOptions,
    // IMPORTANT: only put stuff here that the editor depends on.
    [tiptapOptions]
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.target !== editor.view.dom || !editor.state.selection.empty) return;

      const lastNode = editor.state.doc.lastChild;
      const isLastNodeParagraph = lastNode?.type.name === "paragraph";
      const isEmpty = lastNode?.nodeSize === 2;
      if (!isLastNodeParagraph || !isEmpty) {
        e.preventDefault();
        editor
          ?.chain()
          .insertContentAt(editor.state.doc.nodeSize - 2, "<p></p>")
          .focus("end")
          .run();
      }
    }
    editor.view.dom.addEventListener("click", onClick);
    return () => {
      editor.view.dom.removeEventListener("click", onClick);
    };
  }, [editor]);

  if (readonly) return null;
  return (
    <>
      <ScopedThemeProvider
        scope="editorToolbar"
        sx={{
          width: "100%",
          position: "sticky",
          top: 0,
          bg: "background",
          zIndex: 1
        }}
      >
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
      <Flex
        ref={containerRef}
        sx={{
          flex: 1,
          flexDirection: "column",
          ".tiptap.ProseMirror": { pb: 150 }
        }}
      >
        <TipTap
          {...props}
          editorContainer={() => {
            if (editorContainerRef.current) return editorContainerRef.current;
            const editorContainer = document.createElement("div");
            editorContainer.classList.add("selectable");
            editorContainer.style.flex = "1";
            editorContainer.style.cursor = "text";
            editorContainer.style.color =
              theme.scopes.editor?.primary?.paragraph ||
              theme.scopes.base.primary.paragraph;
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

function toIEditor(editor: Editor): IEditor {
  return {
    focus: ({ position, scrollIntoView } = {}) => {
      if (typeof position === "object")
        editor.chain().focus().setTextSelection(position).run();
      else
        editor.commands.focus(position, {
          scrollIntoView
        });
    },
    undo: () => editor.commands.undo(),
    redo: () => editor.commands.redo(),
    updateContent: (content) => {
      const { from, to } = editor.state.selection;
      editor
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
        ? editor.commands.insertImage(file)
        : editor.commands.insertAttachment(file),
    sendAttachmentProgress: (hash, progress) =>
      editor.commands.updateAttachment(
        {
          progress
        },
        { query: (a) => a.hash === hash, preventUpdate: true }
      ),
    startSearch: () => editor.commands.startSearch()
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
