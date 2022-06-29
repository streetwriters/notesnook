import { Theme } from "@notesnook/theme";
import { useTheme } from "emotion-theming";
import { Toolbar, useTiptap, PortalProvider, Editor } from "notesnook-editor";
import { Box, Flex } from "rebass";
import "notesnook-editor/dist/styles.css";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import useMobile from "../../utils/use-mobile";
import { Attachment } from "./plugins/picker";
import { CharacterCounter, IEditor } from "./types";
import { useConfigureEditor, useSearch, useToolbarConfig } from "./context";
import { createPortal } from "react-dom";
import { AttachmentType } from "notesnook-editor/dist/extensions/attachment";
import { getCurrentPreset } from "../../common/toolbar-config";

type TipTapProps = {
  editorContainer: HTMLElement;
  onChange?: (content: string, counter?: CharacterCounter) => void;
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
  const isMobile = useMobile();
  const counter = useRef<CharacterCounter>();
  const configure = useConfigureEditor();
  const { toolbarConfig } = useToolbarConfig();
  const { isSearching, toggleSearch } = useSearch();

  const editor = useTiptap(
    {
      element: editorContainer,
      editable: !readonly,
      content,
      autofocus: "start",
      onFocus,
      onCreate: ({ editor }) => {
        counter.current = editor.storage.characterCount as CharacterCounter;
        configure({
          editor: toIEditor(editor),
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
          toolbarConfig: getCurrentPreset().tools,
        });
      },
      onUpdate: ({ editor }) => {
        if (onChange) onChange(editor.getHTML(), counter.current);
      },
      onDestroy: () => {
        configure({
          editor: undefined,
          canRedo: false,
          canUndo: false,
          searching: false,
        });
      },
      onTransaction: ({ editor }) => {
        configure({
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
        });
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
    [readonly, nonce]
  );

  useEffect(() => {
    if (isSearching) editor?.commands.startSearch();
    else editor?.commands.endSearch();
  }, [isSearching]);

  useEffect(() => {
    const isEditorSearching = editor?.storage.searchreplace?.isSearching;
    if (isSearching && !isEditorSearching) toggleSearch();
  }, [toggleSearch, editor?.storage.searchreplace?.isSearching]);

  return (
    <>
      <Portal containerId={toolbarContainerId}>
        <Toolbar
          editor={editor}
          theme={theme}
          location={isMobile ? "bottom" : "top"}
          isMobile={isMobile || false}
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
    focus: () => editor.commands.focus("start"),
    undo: () => editor.commands.undo(),
    redo: () => editor.commands.redo(),
    attachFile: (file: Attachment) => {
      if (file.dataurl) {
        editor.commands.insertImage({ ...file, src: file.dataurl });
      } else editor.commands.insertAttachment(file);
    },
    loadImage: (hash, src) => editor.commands.updateImage({ hash, src }),
    sendAttachmentProgress: (hash, type, progress) =>
      editor.commands.setAttachmentProgress({
        hash,
        type: type as any,
        progress,
      }),
  };
}
