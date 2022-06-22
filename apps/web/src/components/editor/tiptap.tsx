import { Theme } from "@notesnook/theme";
import { useTheme } from "emotion-theming";
import { Toolbar, useTiptap, PortalProvider } from "notesnook-editor";
import { EditorContent } from "@tiptap/react";
import { Flex } from "rebass";
import { Editor } from "@tiptap/core";
import "notesnook-editor/dist/styles.css";
import { PropsWithChildren, useEffect, useRef } from "react";
import useMobile from "../../utils/use-mobile";
import { Attachment, AttachmentProgress } from "./plugins/picker";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { EV, EVENTS } from "notes-core/common";
import { CharacterCounter, IEditor } from "./types";
import { useConfigureEditor, useSearch } from "./context";
import { createPortal } from "react-dom";

type TipTapProps = {
  onChange?: (content: string, counter?: CharacterCounter) => void;
  onInsertAttachment?: (type: string) => void;
  onFocus?: () => void;
  content?: string;
  toolbarContainerId?: string;
  readonly?: boolean;
};

function TipTap(props: TipTapProps) {
  const {
    onChange,
    onInsertAttachment,
    onFocus = () => {},
    content,
    toolbarContainerId,
    readonly,
  } = props;

  const theme: Theme = useTheme();
  const isMobile = useMobile();
  const counter = useRef<CharacterCounter>();
  const configure = useConfigureEditor();
  const { isSearching, toggleSearch } = useSearch();

  const editor = useTiptap(
    {
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

  useEffect(() => {
    if (!editor) return;

    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progress: AttachmentProgress) => {
        setTimeout(() =>
          editor.commands.setAttachmentProgress({
            hash: progress.hash,
            type: progress.type,
            progress: Math.round((progress.loaded / progress.total) * 100),
          })
        );
      }
    );

    const mediaAttachmentDownloadedEvent = EV.subscribe(
      EVENTS.mediaAttachmentDownloaded,
      ({
        groupId,
        hash,
        src,
      }: {
        groupId?: string;
        hash: string;
        src: string;
      }) => {
        console.log(src, hash);
        if (groupId?.startsWith("monograph")) return;
        setTimeout(() => editor?.commands?.updateImage({ hash, src }));
      }
    );
    return () => {
      event.unsubscribe();
      mediaAttachmentDownloadedEvent.unsubscribe();
    };
  }, [editor]);

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
      <EditorContent
        style={{
          flex: 1,
          cursor: "text",
          color: theme.colors.text,
        }}
        editor={editor}
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
  };
}
