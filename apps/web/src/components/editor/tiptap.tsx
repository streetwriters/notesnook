import { Theme } from "@notesnook/theme";
import { useTheme } from "emotion-theming";
import { Toolbar, useTiptap, PortalProvider, Editor } from "notesnook-editor";
import { Box, Flex } from "rebass";
import "notesnook-editor/dist/styles.css";
import { PropsWithChildren, useEffect, useRef } from "react";
import useMobile from "../../utils/use-mobile";
import { Attachment } from "./plugins/picker";
import { CharacterCounter, IEditor } from "./types";
import { useConfigureEditor, useSearch } from "./context";
import { createPortal } from "react-dom";
import { AttachmentType } from "notesnook-editor/dist/extensions/attachment";

type TipTapProps = {
  onChange?: (content: string, counter?: CharacterCounter) => void;
  onInsertAttachment?: (type: AttachmentType) => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onFocus?: () => void;
  content?: string;
  toolbarContainerId?: string;
  readonly?: boolean;
};

function TipTap(props: TipTapProps) {
  const {
    onChange,
    onInsertAttachment,
    onDownloadAttachment,
    onFocus = () => {},
    content,
    toolbarContainerId,
    readonly,
  } = props;

  const editorContentRef = useRef<HTMLDivElement>();
  const theme: Theme = useTheme();
  const isMobile = useMobile();
  const counter = useRef<CharacterCounter>();
  const configure = useConfigureEditor();
  const { isSearching, toggleSearch } = useSearch();

  const editor = useTiptap(
    {
      element: editorContentRef.current,
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
        });
      },
      onUpdate: ({ editor }) => {
        if (onChange) onChange(editor.getHTML(), counter.current);
      },
      onDestroy: () => {
        configure({ editor: undefined });
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
    [content, readonly, theme]
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
    <Flex sx={{ flex: 1, flexDirection: "column" }}>
      <Portal containerId={toolbarContainerId}>
        <Toolbar
          editor={editor}
          theme={theme}
          location={isMobile ? "bottom" : "top"}
          isMobile={isMobile || false}
        />
      </Portal>
      <Box
        ref={editorContentRef}
        style={{
          flex: 1,
          cursor: "text",
          color: theme.colors.text,
        }}
      />
    </Flex>
  );
}

function Portal(props: PropsWithChildren<{ containerId?: string }>) {
  const { containerId, children } = props;
  return containerId && document.getElementById(containerId) ? (
    <>
      {createPortal(
        children,
        document.getElementById(containerId),
        containerId
      )}
    </>
  ) : (
    <>{children}</>
  );
}

function TiptapProvider(props: TipTapProps) {
  return (
    <PortalProvider>
      <TipTap {...props} />
    </PortalProvider>
  );
}
export default TiptapProvider;

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
