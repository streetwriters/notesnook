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

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  PropsWithChildren,
  Suspense
} from "react";
import ReactDOM from "react-dom";
import { Box, Button, Flex, Progress, Text } from "@theme-ui/components";
import Properties from "../properties";
import { useStore, store as editorstore } from "../../stores/editor-store";
import {
  useStore as useAppStore,
  store as appstore
} from "../../stores/app-store";
import Toolbar from "./toolbar";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import Tiptap from "./tiptap";
import Header from "./header";
import { Attachment } from "../icons";
import { useEditorInstance } from "./context";
import { attachFile, AttachmentProgress, insertAttachment } from "./picker";
import { saveAttachment, downloadAttachment } from "../../common/attachments";
import { EV, EVENTS } from "@notesnook/core/dist/common";
import { db } from "../../common/db";
import useMobile from "../../hooks/use-mobile";
import Titlebox from "./title-box";
import useTablet from "../../hooks/use-tablet";
import Config from "../../utils/config";
import { AnimatedFlex } from "../animated";
import { EditorLoader } from "../loaders/editor-loader";
import { ScopedThemeProvider } from "../theme-provider";
import { Lightbox } from "../lightbox";
import { Allotment } from "allotment";
import { showToast } from "../../utils/toast";
import { getFormattedDate } from "@notesnook/common";
import { Item, MaybeDeletedItem, isDeleted } from "@notesnook/core/dist/types";
import { PreviewSession } from "./types";

const PDFPreview = React.lazy(() => import("../pdf-preview"));

type DocumentPreview = {
  url?: string;
  hash: string;
};

function onEditorChange(
  noteId: string | undefined,
  sessionId: string,
  content: string,
  ignoreEdit: boolean
) {
  if (!content) return;

  editorstore.get().saveSessionContent(noteId, sessionId, ignoreEdit, {
    type: "tiptap",
    data: content
  });
}

export default function EditorManager({
  noteId,
  nonce
}: {
  noteId?: string | number;
  nonce?: string;
}) {
  const isNewSession = !!nonce && !noteId;
  const isOldSession = !nonce && !!noteId;

  // the only state that changes. Everything else is
  // stored in refs. Update this value to trigger an
  // update.
  const [timestamp, setTimestamp] = useState<number>(0);

  const lastSavedTime = useRef<number>(0);
  const [docPreview, setDocPreview] = useState<DocumentPreview>();

  const previewSession = useRef<PreviewSession>();
  const [dropRef, overlayRef] = useDragOverlay();
  const editorInstance = useEditorInstance();

  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isReadonly = useStore((store) => store.session.readonly);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isPreviewSession = !!previewSession.current;

  const isMobile = useMobile();
  const isTablet = useTablet();

  useEffect(() => {
    const event = db.eventManager.subscribe(
      EVENTS.syncItemMerged,
      async (item?: MaybeDeletedItem<Item>) => {
        if (
          !item ||
          isDeleted(item) ||
          (item.type !== "tiptap" && item.type !== "note") ||
          lastSavedTime.current >= (item.dateEdited as number) ||
          isPreviewSession ||
          !appstore.get().isRealtimeSyncEnabled
        )
          return;

        const { id, contentId, locked } = editorstore.get().session;
        const isContent = item.type === "tiptap" && item.id === contentId;
        const isNote = item.type === "note" && item.id === id;

        if (id && isContent && editorInstance.current) {
          let content: string | null = null;
          if (locked && item.locked) {
            const result = await db.vault
              .decryptContent(item, item.noteId)
              .catch(() => undefined);
            if (result) content = result.data;
            else EV.publish(EVENTS.vaultLocked);
          }
          editorInstance.current.updateContent(item.data as string);
        } else if (isNote) {
          if (!locked && item.locked) return EV.publish(EVENTS.vaultLocked);

          editorstore.get().updateSession(item);
          if (item.title)
            AppEventManager.publish(AppEvents.changeNoteTitle, {
              title: item.title,
              preventSave: true
            });
        }
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [editorInstance, isPreviewSession]);

  const openSession = useCallback(async (noteId: string) => {
    await editorstore.get().openSession(noteId);
    previewSession.current = undefined;

    lastSavedTime.current = Date.now();
    setTimestamp(Date.now());
  }, []);

  useEffect(() => {
    if (!isNewSession) return;

    (async function () {
      await editorstore.newSession(nonce);

      lastSavedTime.current = 0;
      setTimestamp(Date.now());
    })();
  }, [isNewSession, nonce]);

  useEffect(() => {
    if (!isOldSession || typeof noteId === "number") return;

    openSession(noteId);
  }, [noteId]);

  return (
    <ScopedThemeProvider scope="editor" sx={{ flex: 1 }}>
      <Allotment
        proportionalLayout={true}
        onDragEnd={(sizes) => {
          Config.set("editor:panesize", sizes[1]);
        }}
      >
        <Allotment.Pane className="editor-pane">
          <Flex
            ref={dropRef}
            id="editorContainer"
            sx={{
              position: "relative",
              alignSelf: "stretch",
              overflow: "hidden",
              flex: 1,
              flexDirection: "column",
              background: "background"
            }}
          >
            {previewSession.current && noteId && (
              <PreviewModeNotice
                {...previewSession.current}
                onDiscard={() =>
                  typeof noteId === "string" && openSession(noteId)
                }
              />
            )}
            <Editor
              id={noteId}
              nonce={timestamp}
              content={() =>
                previewSession.current?.content.data ||
                editorstore.get().session?.content?.data
              }
              onPreviewDocument={(url) => setDocPreview(url)}
              onContentChange={() => (lastSavedTime.current = Date.now())}
              options={{
                readonly: isReadonly || isPreviewSession,
                onRequestFocus: () => toggleProperties(false),
                focusMode: isFocusMode,
                isMobile: isMobile || isTablet
              }}
            />

            {arePropertiesVisible && (
              <Properties
                onOpenPreviewSession={async (session: PreviewSession) => {
                  previewSession.current = session;
                  setTimestamp(Date.now());
                }}
              />
            )}
            <DropZone overlayRef={overlayRef} />
          </Flex>
        </Allotment.Pane>
        {docPreview && (
          <Allotment.Pane
            minSize={450}
            preferredSize={Config.get("editor:panesize", 500)}
          >
            <ScopedThemeProvider
              scope="editorSidebar"
              id="editorSidebar"
              sx={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: "1px solid var(--border)",
                height: "100%",
                bg: "background"
              }}
            >
              {docPreview.url ? (
                <Suspense
                  fallback={
                    <DownloadAttachmentProgress hash={docPreview.hash} />
                  }
                >
                  <PDFPreview
                    fileUrl={docPreview.url}
                    hash={docPreview.hash}
                    onClose={() => setDocPreview(undefined)}
                  />
                </Suspense>
              ) : (
                <DownloadAttachmentProgress hash={docPreview.hash} />
              )}
            </ScopedThemeProvider>
          </Allotment.Pane>
        )}
      </Allotment>
    </ScopedThemeProvider>
  );
}

type DownloadAttachmentProgressProps = {
  hash: string;
};
function DownloadAttachmentProgress(props: DownloadAttachmentProgressProps) {
  const { hash } = props;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progress: AttachmentProgress) => {
        if (progress.hash === hash) {
          setProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      }
    );

    return () => {
      event.unsubscribe();
    };
  }, [hash]);

  return (
    <Flex
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}
    >
      <Text variant="title">Downloading attachment ({progress}%)</Text>
      <Progress
        value={progress}
        max={100}
        sx={{ width: ["90%", "35%"], mt: 1 }}
      />
    </Flex>
  );
}

type EditorOptions = {
  isMobile?: boolean;
  headless?: boolean;
  readonly?: boolean;
  focusMode?: boolean;
  onRequestFocus?: () => void;
};
type EditorProps = {
  id?: string | number;
  content: () => string | undefined;
  nonce?: number;
  options?: EditorOptions;
  onContentChange?: () => void;
  onPreviewDocument?: (preview: DocumentPreview) => void;
};
export function Editor(props: EditorProps) {
  const { id, content, nonce, options, onContentChange, onPreviewDocument } =
    props;
  const { readonly, headless, isMobile } = options || {
    headless: false,
    readonly: false,
    focusMode: false,
    isMobile: false
  };
  const [isLoading, setIsLoading] = useState(true);

  const editor = useEditorInstance();

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total }: AttachmentProgress) => {
        editor.current?.sendAttachmentProgress(
          hash,
          Math.round((loaded / total) * 100)
        );
      }
    );

    return () => {
      event.unsubscribe();
    };
  }, [editor]);

  return (
    <EditorChrome isLoading={isLoading} {...props}>
      <Tiptap
        isMobile={isMobile}
        nonce={nonce}
        readonly={readonly}
        toolbarContainerId={headless ? undefined : "editorToolbar"}
        content={content}
        downloadOptions={{
          corsHost: Config.get("corsProxy", "https://cors.notesnook.com")
        }}
        onLoad={() => {
          if (nonce && nonce > 0) setIsLoading(false);
        }}
        onContentChange={onContentChange}
        onChange={onEditorChange}
        onDownloadAttachment={(attachment) => saveAttachment(attachment.hash)}
        onPreviewAttachment={async (data) => {
          const { hash } = data;
          const attachment = await db.attachments.attachment(hash);
          if (attachment && attachment.mimeType.startsWith("image/")) {
            const container = document.getElementById("dialogContainer");
            if (!(container instanceof HTMLElement)) return;

            const dataurl = await downloadAttachment(
              hash,
              "base64",
              id?.toString()
            );
            if (!dataurl)
              return showToast("error", "This image cannot be previewed.");

            ReactDOM.render(
              <ScopedThemeProvider>
                <Lightbox
                  image={dataurl}
                  onClose={() => {
                    ReactDOM.unmountComponentAtNode(container);
                  }}
                />
              </ScopedThemeProvider>,
              container
            );
          } else if (attachment && onPreviewDocument) {
            onPreviewDocument({ hash });
            const blob = await downloadAttachment(hash, "blob", id?.toString());
            if (!blob) return;
            onPreviewDocument({ url: URL.createObjectURL(blob), hash });
          }
        }}
        onInsertAttachment={(type) => {
          const mime = type === "file" ? "*/*" : "image/*";
          insertAttachment(mime).then((file) => {
            if (!file) return;
            editor.current?.attachFile(file);
          });
        }}
        onGetAttachmentData={(attachment) => {
          return downloadAttachment(
            attachment.hash,
            attachment.type === "web-clip" ? "text" : "base64",
            id?.toString()
          );
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

function EditorChrome(
  props: PropsWithChildren<EditorProps & { isLoading: boolean }>
) {
  const { options, children, isLoading } = props;
  const { readonly, focusMode, headless, onRequestFocus, isMobile } =
    options || {
      headless: false,
      readonly: false,
      focusMode: false,
      isMobile: false
    };
  const editorMargins = useStore((store) => store.editorMargins);

  if (headless) return <>{children}</>;

  return (
    <>
      {isLoading ? (
        <AnimatedFlex
          sx={{
            position: "absolute",
            overflow: "hidden",
            flex: 1,
            flexDirection: "column",
            width: "100%",
            height: "100%",
            zIndex: 999,
            bg: "background"
          }}
        >
          <EditorLoader />
        </AnimatedFlex>
      ) : null}

      <Toolbar />
      <FlexScrollContainer
        className="editorScroll"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        <Flex
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: ["stretch", focusMode ? "center" : "stretch", "center"],
            maxWidth: editorMargins ? "min(100%, 850px)" : "auto",
            width: "100%"
          }}
          pl={6}
          pr={2}
          onClick={onRequestFocus}
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
          <Titlebox readonly={readonly || false} />
          <Header readonly={readonly || false} />
          <AnimatedFlex
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            sx={{ flex: 1 }}
          >
            {children}
          </AnimatedFlex>
        </Flex>
      </FlexScrollContainer>
      {isMobile && (
        <Box
          id="editorToolbar"
          sx={{
            display: "flex",
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
        await editorstore.saveSessionContent(id, sessionId, false, content);
      }
      onDiscard();
    },
    [onDiscard, content]
  );

  return (
    <Flex
      bg="var(--background-secondary)"
      p={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
      data-test-id="preview-notice"
    >
      <Flex mr={4} sx={{ flexDirection: "column" }}>
        <Text variant={"subtitle"}>Preview</Text>
        <Text variant={"body"}>
          You are previewing note version edited from{" "}
          {getFormattedDate(dateCreated, "date-time")} to{" "}
          {getFormattedDate(dateEdited, "date-time")}.
        </Text>
      </Flex>
      <Flex>
        <Button
          data-test-id="preview-notice-cancel"
          variant={"secondary"}
          mr={1}
          px={4}
          onClick={() => disablePreviewMode(true)}
        >
          Cancel
        </Button>
        <Button
          variant="accent"
          data-test-id="preview-notice-restore"
          px={4}
          onClick={async () => {
            await disablePreviewMode(false);
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
        bg: "backdrop",
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
          border: "2px dashed var(--border)",
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
