/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import {
  useEffect,
  useCallback,
  useState,
  useRef,
  PropsWithChildren
} from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import Properties from "../properties";
import { useStore, store as editorstore } from "../../stores/editor-store";
import Toolbar from "./toolbar";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import { formatDate } from "@notesnook/core/utils/date";
import { debounceWithId } from "../../utils/debounce";
import Tiptap from "./tiptap";
import Header from "./header";
import { Attachment } from "../icons";
import { useEditorInstance } from "./context";
import { attachFile, AttachmentProgress, insertAttachment } from "./picker";
import { downloadAttachment } from "../../common/attachments";
import { EV, EVENTS } from "@notesnook/core/common";
import { db } from "../../common/db";
import useMobile from "../../hooks/use-mobile";
import Titlebox from "./title-box";

type PreviewSession = {
  content: { data: string; type: string };
  dateCreated: number;
  dateEdited: number;
};

function onEditorChange(noteId: string, sessionId: string, content: string) {
  if (!content) return;

  editorstore.get().saveSessionContent(noteId, sessionId, {
    type: "tiptap",
    data: content
  });
}

function onTitleChange(noteId: string, title: string) {
  if (!title) return;

  editorstore.get().setTitle(noteId, title);
}

const debouncedOnTitleChange = debounceWithId(onTitleChange, 100);

export default function EditorManager({
  noteId,
  nonce
}: {
  noteId: string | number;
  nonce?: string;
}) {
  const isNewSession = !!nonce && noteId === 0;
  const isOldSession = !nonce && !!noteId;

  // the only state that changes. Everything else is
  // stored in refs. Update this value to trigger an
  // update.
  const [timestamp, setTimestamp] = useState<number>(0);

  const content = useRef<string>("");
  const title = useRef<string>("");
  const previewSession = useRef<PreviewSession>();
  const [dropRef, overlayRef] = useDragOverlay();

  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isReadonly = useStore((store) => store.session.readonly);
  const isPreviewSession = !!previewSession.current;

  const openSession = useCallback(async (noteId: string | number) => {
    await editorstore.get().openSession(noteId);

    const { getSessionContent, session } = editorstore.get();
    const sessionContent = await getSessionContent();

    previewSession.current = undefined;
    title.current = session.title;
    content.current = sessionContent?.data;
    setTimestamp(Date.now());
  }, []);

  const loadMedia = useCallback(async () => {
    if (previewSession.current) {
      await db.content?.downloadMedia(
        noteId,
        previewSession.current.content,
        true
      );
    } else if (noteId && content.current) {
      await db.attachments?.downloadImages(noteId);
    }
  }, [noteId]);

  useEffect(() => {
    if (!isNewSession) return;

    (async function () {
      await editorstore.newSession(nonce);

      title.current = "";
      content.current = "";
      setTimestamp(Date.now());
    })();
  }, [isNewSession, nonce]);

  useEffect(() => {
    if (!isOldSession) return;

    openSession(noteId);
  }, [openSession, noteId, isOldSession, isReadonly]);

  return (
    <Flex
      ref={dropRef}
      id="editorContainer"
      sx={{
        position: "relative",
        alignSelf: "stretch",
        overflow: "hidden",
        flex: 1,
        flexDirection: "column"
      }}
    >
      {previewSession.current && (
        <PreviewModeNotice
          {...previewSession.current}
          onDiscard={() => openSession(noteId)}
        />
      )}
      <Editor
        nonce={timestamp}
        title={title.current}
        content={content.current}
        options={{
          readonly: isReadonly || isPreviewSession,
          onRequestFocus: () => toggleProperties(false),
          onLoadMedia: loadMedia
        }}
      />
      {arePropertiesVisible && (
        <Properties
          onOpenPreviewSession={async (session: PreviewSession) => {
            const { content: sessionContent } = session;
            content.current = sessionContent.data;
            previewSession.current = session;
            setTimestamp(Date.now());
          }}
        />
      )}
      <DropZone overlayRef={overlayRef} />
    </Flex>
  );
}

type EditorOptions = {
  headless?: boolean;
  readonly?: boolean;
  focusMode?: boolean;
  onRequestFocus?: () => void;
  onLoadMedia?: () => void;
};
type EditorProps = {
  content: string;
  title?: string;
  nonce?: number;
  options?: EditorOptions;
};
export function Editor(props: EditorProps) {
  const { content, nonce, options } = props;
  const { readonly, headless, onLoadMedia } = options || {
    headless: false,
    readonly: false,
    focusMode: false
  };

  const editor = useEditorInstance();

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total, type }: AttachmentProgress) => {
        editor.current?.sendAttachmentProgress(
          hash,
          type,
          Math.round((loaded / total) * 100)
        );
      }
    );

    const mediaAttachmentDownloadedEvent = EV.subscribe(
      EVENTS.mediaAttachmentDownloaded,
      ({
        groupId,
        hash,
        src
      }: {
        groupId?: string;
        hash: string;
        src: string;
      }) => {
        if (groupId?.startsWith("monograph")) return;
        editor.current?.loadImage(hash, src);
      }
    );

    return () => {
      event.unsubscribe();
      mediaAttachmentDownloadedEvent.unsubscribe();
    };
  }, [editor]);

  return (
    <EditorChrome {...props}>
      <Tiptap
        nonce={nonce}
        readonly={readonly}
        toolbarContainerId={headless ? undefined : "editorToolbar"}
        content={content}
        onLoad={() => {
          if (onLoadMedia) onLoadMedia();
        }}
        onChange={onEditorChange}
        onDownloadAttachment={(attachment) =>
          downloadAttachment(attachment.hash)
        }
        onInsertAttachment={(type) => {
          const mime = type === "file" ? "*/*" : "image/*";
          insertAttachment(mime).then((file) => {
            if (!file) return;
            editor.current?.attachFile(file);
          });
        }}
        onAttachFile={async (file) => {
          const result = await attachFile(file);
          if (!result) return;
          editor.current?.attachFile(result);
        }}
      />
    </EditorChrome>
  );
}

function EditorChrome(props: PropsWithChildren<EditorProps>) {
  const { title, nonce, options, children } = props;
  const { readonly, focusMode, headless, onRequestFocus } = options || {
    headless: false,
    readonly: false,
    focusMode: false
  };
  const isMobile: boolean | null = useMobile();

  if (headless) return <>{children}</>;

  return (
    <>
      <Toolbar />
      <FlexScrollContainer
        className="editorScroll"
        style={{}}
        viewStyle={{ display: "flex", flexDirection: "column" }}
      >
        <Flex
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: ["stretch", focusMode ? "center" : "stretch", "center"],
            width: "100%",
            maxWidth: focusMode
              ? "min(100%, 850px)"
              : "max(calc(100% - 200px), 850px)"
          }}
          px={2}
          onClick={onRequestFocus}
          // mt={[2, 2, 25]}
        >
          {!isMobile && (
            <Box
              id="editorToolbar"
              sx={{
                display: readonly ? "none" : "flex",
                bg: "background",
                position: "sticky",
                top: 0,
                mb: 1,
                zIndex: 2
              }}
            />
          )}
          {title !== undefined ? (
            <Titlebox
              nonce={nonce}
              readonly={readonly || false}
              setTitle={(title) => {
                const { sessionId, id } = editorstore.get().session;
                debouncedOnTitleChange(sessionId, id, title);
              }}
              title={title}
            />
          ) : null}
          <Header readonly={readonly} />
          {children}
        </Flex>
      </FlexScrollContainer>

      {isMobile && (
        <Box
          id="editorToolbar"
          sx={{
            display: readonly ? "none" : "flex",
            bg: "background",
            position: "sticky",
            top: 0,
            mb: 1,
            zIndex: 2,
            px: [2, 2, 35]
          }}
        />
      )}
    </>
  );
}

type PreviewModeNoticeProps = PreviewSession & {
  onDiscard: () => void;
};
function PreviewModeNotice(props: PreviewModeNoticeProps) {
  const { dateCreated, dateEdited, content, onDiscard } = props;
  const disablePreviewMode = useCallback(
    async (cancelled: boolean) => {
      const { id, sessionId } = editorstore.get().session;
      if (!cancelled) {
        await editorstore.saveSessionContent(id, sessionId, content);
      }
      onDiscard();
    },
    [onDiscard, content]
  );

  return (
    <Flex
      bg="bgSecondary"
      p={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Flex mr={4} sx={{ flexDirection: "column" }}>
        <Text variant={"subtitle"}>Preview</Text>
        <Text variant={"body"}>
          You are previewing note version edited from {formatDate(dateCreated)}{" "}
          to {formatDate(dateEdited)}.
        </Text>
      </Flex>
      <Flex>
        <Button
          data-test-id="editor-notice-cancel"
          variant={"secondary"}
          mr={1}
          px={4}
          onClick={() => disablePreviewMode(true)}
        >
          Cancel
        </Button>
        <Button
          data-test-id="editor-notice-action"
          px={4}
          onClick={async () => {
            await disablePreviewMode(false);
            await editorstore.get().saveSession();
          }}
        >
          Restore
        </Button>
      </Flex>
    </Flex>
  );
}

type DropZoneProps = {
  overlayRef: React.MutableRefObject<HTMLElement | undefined>;
};
function DropZone(props: DropZoneProps) {
  const { overlayRef } = props;
  const editor = useEditorInstance();

  return (
    <Box
      ref={overlayRef}
      id="drag-overlay"
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        bg: "overlay",
        zIndex: 3,
        alignItems: "center",
        justifyContent: "center",
        display: "none"
      }}
      onDrop={async (e) => {
        if (!editor || !e.dataTransfer.files?.length) return;
        e.preventDefault();

        for (const file of e.dataTransfer.files) {
          const result = await attachFile(file);
          if (!result) continue;
          editor.current?.attachFile(result);
        }
      }}
    >
      <Flex
        sx={{
          border: "2px dashed var(--fontTertiary)",
          borderRadius: "default",
          p: 70,
          flexDirection: "column",
          pointerEvents: "none"
        }}
      >
        <Attachment size={72} />
        <Text variant={"heading"} sx={{ color: "icon", mt: 2 }}>
          Drop your files here to attach
        </Text>
      </Flex>
    </Box>
  );
}

function useDragOverlay() {
  const dropElementRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLElement>();

  useEffect(() => {
    const dropElement = dropElementRef.current;
    const overlay = overlayRef.current;

    if (!dropElement || !overlay) return;

    function showOverlay(e: DragEvent) {
      if (!overlay || !isFile(e)) return;

      overlay.style.display = "flex";
    }

    function hideOverlay() {
      if (!overlay) return;
      overlay.style.display = "none";
    }

    function allowDrag(e: DragEvent) {
      if (!e.dataTransfer || !isFile(e)) return;

      e.dataTransfer.dropEffect = "copy";
      e.preventDefault();
    }

    dropElement.addEventListener("dragenter", showOverlay);
    overlay.addEventListener("drop", hideOverlay);
    overlay.addEventListener("dragenter", allowDrag);
    overlay.addEventListener("dragover", allowDrag);
    overlay.addEventListener("dragleave", hideOverlay);
    return () => {
      dropElement.removeEventListener("dragenter", showOverlay);
      overlay.removeEventListener("drop", hideOverlay);
      overlay.removeEventListener("dragenter", allowDrag);
      overlay.removeEventListener("dragover", allowDrag);
      overlay.removeEventListener("dragleave", hideOverlay);
    };
  }, []);

  return [dropElementRef, overlayRef] as const;
}

function isFile(e: DragEvent) {
  return (
    e.dataTransfer &&
    (e.dataTransfer.files?.length > 0 ||
      e.dataTransfer.types?.some((a) => a === "Files"))
  );
}
