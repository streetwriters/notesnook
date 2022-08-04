import "@streetwriters/editor/styles/styles.css";
import "@streetwriters/editor/styles/katex.min.css";
import "@streetwriters/editor/styles/katexfonts.css";
import "@streetwriters/editor/styles/fonts.css";
import "@streetwriters/editor/styles/prism-theme.css";
import { Theme } from "@streetwriters/theme";
import { useTheme } from "emotion-theming";
import {
  Toolbar,
  useTiptap,
  PortalProvider,
  Editor,
  AttachmentType,
  usePermissionHandler,
} from "@streetwriters/editor";
import { Box, Flex } from "rebass";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import useMobile from "../../utils/use-mobile";
import { Attachment } from "./picker";
import { IEditor } from "./types";
import { useConfigureEditor, useSearch, useToolbarConfig } from "./context";
import { createPortal } from "react-dom";
import { getCurrentPreset } from "../../common/toolbar-config";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useSettingsStore } from "../../stores/setting-store";

var saveTimeout = 0;
type TipTapProps = {
  editorContainer: HTMLElement;
  onLoad?: () => void;
  onChange?: (content: string) => void;
  onInsertAttachment?: (type: AttachmentType) => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onFocus?: () => void;
  content?: string;
  toolbarContainerId?: string;
  readonly?: boolean;
  nonce?: number;
};

function TipTap(props: TipTapProps) {
  const {
    onLoad,
    onChange,
    onInsertAttachment,
    onDownloadAttachment,
    onFocus = () => {},
    content,
    toolbarContainerId,
    editorContainer,
    readonly,
    nonce,
  } = props;

  const theme: Theme = useTheme();
  const isUserPremium = useIsUserPremium();
  const isMobile = useMobile();
  const configure = useConfigureEditor();
  const doubleSpacedLines = useSettingsStore(
    (store) => store.doubleSpacedLines
  );
  const { toolbarConfig } = useToolbarConfig();
  const { isSearching, toggleSearch } = useSearch();

  usePermissionHandler({
    claims: {
      premium: isUserPremium,
    },
    onPermissionDenied: (claim) => {
      if (claim === "premium") showBuyDialog();
    },
  });

  const editor = useTiptap(
    {
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
              selected: 0,
            },
          },
        });
        if (onLoad) onLoad();
      },
      onUpdate: ({ editor }) => {
        if (!editor.isEditable) return;

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          if (onChange) onChange(editor.getHTML());

          configure({
            statistics: {
              words: {
                total: countWords(editor.view.dom.innerText),
                selected: 0,
              },
            },
          });
        }, 500) as unknown as number;
      },
      onDestroy: () => {
        configure({
          editor: undefined,
          canRedo: false,
          canUndo: false,
          searching: false,
          statistics: undefined,
        });
      },
      onTransaction: ({ editor }) => {
        configure({
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
        });
      },
      onSelectionUpdate: ({ editor, transaction }) => {
        configure((old) => ({
          statistics: {
            words: {
              total:
                old.statistics?.words.total ||
                countWords(editor.view.dom.innerText),
              selected: getSelectedWords(
                editor as Editor,
                transaction.selection
              ),
            },
          },
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
    },
    // IMPORTANT: only put stuff here that the editor depends on.
    [readonly, nonce]
  );

  useEffect(() => {
    const isEditorSearching = editor?.storage.searchreplace?.isSearching;
    if (isSearching) editor?.commands.startSearch();
    else if (isEditorSearching) editor?.commands.endSearch();
  }, [isSearching]);

  useEffect(() => {
    const isEditorSearching = editor?.storage.searchreplace?.isSearching;
    if (isSearching && !isEditorSearching) toggleSearch();
  }, [toggleSearch, editor?.storage.searchreplace?.isSearching]);

  useEffect(() => {
    if (!editorContainer) return;
    const currentEditor = editor;
    function onClick(e: MouseEvent) {
      if (currentEditor?.isFocused || e.target !== editorContainer) return;
      currentEditor?.commands.focus("end");
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

function TiptapWrapper(props: Omit<TipTapProps, "editorContainer">) {
  const [isReady, setIsReady] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>();
  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <PortalProvider>
      <Flex sx={{ flex: 1, flexDirection: "column" }}>
        {isReady && editorContainerRef.current ? (
          <TipTap {...props} editorContainer={editorContainerRef.current} />
        ) : null}
        <Box
          ref={editorContainerRef}
          className="selectable"
          style={{
            flex: 1,
            cursor: "text",
            color: "var(--text)", // TODO!
            paddingBottom: 150,
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
    attachFile: (file: Attachment) => {
      if (file.dataurl) {
        editor.current?.commands.insertImage({ ...file, src: file.dataurl });
      } else editor.current?.commands.insertAttachment(file);
    },
    loadImage: (hash, src) =>
      editor.current?.commands.updateImage({ hash, src }),
    sendAttachmentProgress: (hash, type, progress) =>
      editor.current?.commands.setAttachmentProgress({
        hash,
        type: type as any,
        progress,
      }),
  };
}

function getTotalWords(editor: Editor): number {
  const documentText = editor.state.doc.textBetween(
    0,
    editor.state.doc.content.size,
    "\n",
    " "
  );
  return countWords(documentText);
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

function countWords(str: string) {
  let count = 0;
  let shouldCount = false;

  for (var i = 0; i < str.length; ++i) {
    const s = str[i];

    if (
      s === " " ||
      s === "\r" ||
      s === "\n" ||
      s === "*" ||
      s === "/" ||
      s === "&"
    ) {
      if (!shouldCount) continue;
      ++count;
      shouldCount = false;
    } else {
      shouldCount = true;
    }
  }

  if (shouldCount) ++count;
  return count;
}
