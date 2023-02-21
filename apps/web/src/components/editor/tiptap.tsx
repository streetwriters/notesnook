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
import "@notesnook/editor/styles/prism-theme.css";
import { Theme } from "@notesnook/theme";
import { useTheme } from "@emotion/react";
import {
  Toolbar,
  useTiptap,
  PortalProvider,
  Editor,
  AttachmentType,
  usePermissionHandler,
  getHTMLFromFragment,
  Fragment,
  getTotalWords,
  countWords,
  type DownloadOptions
} from "@notesnook/editor";
import { Box, Flex } from "@theme-ui/components";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Attachment } from "./picker";
import { IEditor } from "./types";
import {
  useConfigureEditor,
  useSearch,
  useToolbarConfig,
  configureEditor
} from "./context";
import { createPortal } from "react-dom";
import { getCurrentPreset } from "../../common/toolbar-config";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import { debounceWithId } from "../../utils/debounce";
import { store as editorstore } from "../../stores/editor-store";
import TurndownService from "turndown";

type TipTapProps = {
  editorContainer: HTMLElement;
  onLoad?: () => void;
  onChange?: (id: string, sessionId: string, content: string) => void;
  onContentChange?: () => void;
  onInsertAttachment?: (type: AttachmentType) => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onAttachFile?: (file: File) => void;
  onFocus?: () => void;
  content?: string;
  toolbarContainerId?: string;
  readonly?: boolean;
  nonce?: number;
  theme: Theme;
  isMobile?: boolean;
  downloadOptions?: DownloadOptions;
};

const SAVE_INTERVAL = process.env.REACT_APP_TEST ? 100 : 300;

function save(
  sessionId: string,
  noteId: string,
  editor: Editor,
  content: Fragment,
  preventSave: boolean,
  onChange?: (id: string, sessionId: string, html: string) => void
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
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const normalizedTarget = normalizeWhiteSpace(wrapper);
  const normalizedHTML = normalizedTarget.innerHTML;

  onChange?.(noteId, sessionId, normalizedHTML);
}

const deferredSave = debounceWithId(save, SAVE_INTERVAL);

function TipTap(props: TipTapProps) {
  const {
    onLoad,
    onChange,
    onInsertAttachment,
    onDownloadAttachment,
    onAttachFile,
    onContentChange,
    onFocus = () => {},
    content,
    toolbarContainerId,
    editorContainer,
    readonly,
    nonce,
    theme,
    isMobile,
    downloadOptions
  } = props;

  const isUserPremium = useIsUserPremium();
  const configure = useConfigureEditor();
  const doubleSpacedLines = useSettingsStore(
    (store) => store.doubleSpacedLines
  );
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

  const editor = useTiptap(
    {
      editorProps: {
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
      isKeyboardOpen: true,
      isMobile: isMobile || false,
      element: editorContainer,
      editable: !readonly,
      content,
      autofocus: "start",
      onFocus,
      onCreate: ({ editor }) => {
        configure({
          editor: toIEditor(editor as Editor),
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
          toolbarConfig: getCurrentPreset().tools,
          statistics: {
            words: {
              total: getTotalWords(editor as Editor),
              selected: 0
            }
          }
        });
        if (onLoad) onLoad();
        editor.commands.refreshSearch();
      },
      onUpdate: ({ editor, transaction }) => {
        onContentChange?.();

        const preventSave = transaction?.getMeta("preventSave") as boolean;
        const { id, sessionId } = editorstore.get().session;
        const content = editor.state.doc.content;

        deferredSave(
          sessionId,
          sessionId,
          id,
          editor as Editor,
          content,
          preventSave || !editor.isEditable,
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
      onSelectionUpdate: ({ editor, transaction }) => {
        const content = editor.state.doc.content;
        configure((old) => ({
          statistics: {
            words: {
              total:
                old.statistics?.words.total ||
                countWords(content.textBetween(0, content.size, "\n", " ")),
              selected: getSelectedWords(
                editor as Editor,
                transaction.selection
              )
            }
          }
        }));
      },
      theme,
      onOpenAttachmentPicker: (_editor, type) => {
        onInsertAttachment?.(type);
        return true;
      },
      onDownloadAttachment: (_editor, attachment) => {
        onDownloadAttachment?.(attachment);
        return true;
      },
      onOpenLink: (url) => {
        window.open(url, "_blank");
        return true;
      }
    },
    // IMPORTANT: only put stuff here that the editor depends on.
    [readonly, nonce]
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
        <Toolbar
          editor={editor}
          theme={theme}
          location={isMobile ? "bottom" : "top"}
          tools={toolbarConfig}
        />
      </Portal>
    </>
  );
}

function TiptapWrapper(props: Omit<TipTapProps, "editorContainer" | "theme">) {
  const theme = useTheme() as Theme;
  const [isReady, setIsReady] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
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
            theme={theme}
          />
        ) : null}
        <Box
          ref={editorContainerRef}
          className="selectable"
          style={{
            flex: 1,
            cursor: "text",
            color: theme.colors.text, // TODO!
            paddingBottom: 150
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
    focus: () => editor.current?.commands.focus("start"),
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
        .setContent(content, true)
        .setTextSelection({
          from,
          to
        })
        .run();
    },
    attachFile: (file: Attachment) => {
      if (file.dataurl) {
        editor.current?.commands.insertImage({ ...file, src: file.dataurl });
      } else editor.current?.commands.insertAttachment(file);
    },
    loadWebClip: (hash, src) =>
      editor.current?.commands.updateWebClip({ hash }, { src }),
    loadImage: (hash, src) =>
      editor.current?.commands.updateImage(
        { hash },
        { hash, src, preventUpdate: true }
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

export function getTextNodesIn(el: HTMLElement | Text | Node) {
  const textNodes: Text[] = [];
  if (el.nodeType === 3) {
    textNodes.push(el as Text);
  } else {
    const children = el.childNodes;
    for (let i in children) {
      textNodes.push(...getTextNodesIn(children[i]));
    }
  }
  return textNodes;
}

// @NOTE: Convert white space to &nbsp; before getting markdown
function normalizeWhiteSpace(el: HTMLElement) {
  const target = el.cloneNode(true) as HTMLElement;

  target.normalize();

  const nodes = getTextNodesIn(target);
  for (let i in nodes) {
    if (nodes[i].textContent)
      nodes[i].textContent =
        nodes[i].textContent?.replace(/ /g, "\u00a0") || "";
    nodes[i].textContent =
      nodes[i].textContent?.replace(/\t/g, "\u00a0\u00a0\u00a0\u00a0") || "";
  }

  return target;
}
