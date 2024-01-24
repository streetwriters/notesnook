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
import { Box, Flex, Progress, Text } from "@theme-ui/components";
import Properties from "../properties";
import { useEditorStore, SaveState } from "../../stores/editor-store";
import {
  useStore as useAppStore,
  store as appstore
} from "../../stores/app-store";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import Tiptap, { OnChangeHandler } from "./tiptap";
import Header from "./header";
import { Attachment } from "../icons";
import { useEditorManager } from "./manager";
import { attachFile, AttachmentProgress, insertAttachment } from "./picker";
import { saveAttachment, downloadAttachment } from "../../common/attachments";
import { EV, EVENTS } from "@notesnook/core/dist/common";
import { db } from "../../common/db";
import useMobile from "../../hooks/use-mobile";
import Titlebox from "./title-box";
import useTablet from "../../hooks/use-tablet";
import Config from "../../utils/config";
import { ScopedThemeProvider } from "../theme-provider";
import { Lightbox } from "../lightbox";
import { Allotment } from "allotment";
import { showToast } from "../../utils/toast";
import { debounce, debounceWithId } from "@notesnook/common";
import { Item, MaybeDeletedItem, isDeleted } from "@notesnook/core/dist/types";
import { PreviewSession } from "./types";
import { Freeze } from "react-freeze";
import { EditorActionBar } from "./action-bar";
import { UnlockView } from "../unlock";
import DiffViewer from "../diff-viewer";
import TableOfContents from "./table-of-contents";
import { showNoteLinkingDialog } from "../../common/dialog-controller";
import { scrollIntoViewById } from "@notesnook/editor";

const PDFPreview = React.lazy(() => import("../pdf-preview"));

type DocumentPreview = {
  url?: string;
  hash: string;
};

function saveContent(noteId: string, sessionId: string, content: () => string) {
  console.log("SAVE to note", noteId, sessionId);
  useEditorStore.getState().saveSessionContent(noteId, sessionId, {
    type: "tiptap",
    data: content()
  });
}
const deferredSave = debounceWithId(saveContent, 100);

export default function TabsView() {
  const sessions = useEditorStore((store) => store.sessions);
  const activeSessionId = useEditorStore((store) => store.activeSessionId);

  useEffect(() => {
    if (!activeSessionId) return;
    // if the session isn't yet rendered, do nothing.
    const activeSession = useEditorStore.getState().getSession(activeSessionId);
    if (!activeSession?.needsHydration)
      useEditorManager.getState().editors[activeSessionId]?.editor?.focus();
  }, [activeSessionId]);
  console.log("TabsView", sessions, activeSessionId);
  return (
    <>
      <EditorActionBar />
      {sessions.map((session) => (
        <Freeze key={session.id} freeze={session.id !== activeSessionId}>
          {session.needsHydration ? null : session.type === "locked" ? (
            <UnlockView
              buttonTitle="Open note"
              subtitle="Please enter the password to unlock this note."
              title={session.note.title}
              unlock={async (password) => {
                const note = await db.vault.open(session.id, password);
                if (!note) throw new Error("note with this id does not exist.");

                useEditorStore.getState().addSession({
                  type: "default",
                  id: session.id,
                  note: session.note,
                  saveState: SaveState.Saved,
                  sessionId: `${Date.now()}`,
                  pinned: session.pinned,
                  preview: session.preview,
                  content: note.content
                });
              }}
            />
          ) : session.type === "conflicted" || session.type === "diff" ? (
            <DiffViewer session={session} />
          ) : (
            <MemoizedEditorView id={session.id} />
          )}
        </Freeze>
      ))}
    </>
  );
}

const MemoizedEditorView = React.memo(
  EditorView,
  (prev, next) => prev.id === next.id
);
function EditorView({ id }: { id: string }) {
  const lastSavedTime = useRef<number>(Date.now());
  const [docPreview, setDocPreview] = useState<DocumentPreview>();

  const previewSession = useRef<PreviewSession>();
  const [dropRef, overlayRef] = useDragOverlay();

  const arePropertiesVisible = useEditorStore(
    (store) => store.arePropertiesVisible
  );
  const isTOCVisible = useEditorStore((store) => store.isTOCVisible);
  const toggleProperties = useEditorStore((store) => store.toggleProperties);
  const isReadonly = useEditorStore(
    (store) => store.getSession(id, ["default"])?.note?.readonly
  );
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isPreviewSession = !!previewSession.current;

  const isMobile = useMobile();
  const isTablet = useTablet();

  useEffect(() => {
    const event = db.eventManager.subscribe(
      EVENTS.syncItemMerged,
      async (item?: MaybeDeletedItem<Item>) => {
        const session = useEditorStore
          .getState()
          .getSession(id, ["unlocked", "default"]);
        const editor = useEditorManager.getState().getEditor(id)?.editor;
        if (
          !editor ||
          !session?.note ||
          !item ||
          isDeleted(item) ||
          (item.type !== "tiptap" && item.type !== "note") ||
          lastSavedTime.current >= (item.dateEdited as number) ||
          isPreviewSession ||
          !appstore.get().isRealtimeSyncEnabled
        )
          return;

        const { contentId, locked } = session.note;
        const isContent = item.type === "tiptap" && item.id === contentId;
        const isNote = item.type === "note" && item.id === id;

        if (id && isContent) {
          let content: string | null = null;
          if (locked && item.locked) {
            const result = await db.vault
              .decryptContent(item, item.noteId)
              .catch(() => undefined);
            if (result) content = result.data;
            else EV.publish(EVENTS.vaultLocked);
          } else if (!item.locked) content = item.data;
          if (!content) return;

          const oldHashes = editor.getMediaHashes();

          editor.updateContent(content);

          const newHashes = editor.getMediaHashes();
          const hashesToLoad = newHashes.filter(
            (hash, index) => hash !== oldHashes[index]
          );

          if (appstore.get().isSyncing()) {
            db.eventManager.subscribe(
              EVENTS.syncCompleted,
              async () => {
                await db.attachments.downloadMedia(id, hashesToLoad);
              },
              true
            );
          } else {
            await db.attachments.downloadMedia(id, hashesToLoad);
          }
        } else if (isNote) {
          if (!locked && item.locked) return EV.publish(EVENTS.vaultLocked);

          useEditorStore
            .getState()
            .updateSession(id, ["default"], { note: item });
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
  }, [id, isPreviewSession]);

  // const openSession = useCallback(async (noteId: string) => {
  //   await useEditorStore.getState().openSession(noteId);
  //   previewSession.current = undefined;

  //   lastSavedTime.current = Date.now();
  //   setTimestamp(Date.now());
  // }, []);

  const loadMedia = useCallback(async () => {
    if (previewSession.current) {
      await db.content.downloadMedia(id, previewSession.current.content, true);
    } else if (useEditorStore.getState().getSession(id, ["default"])?.content) {
      await db.attachments.downloadMedia(id);
    }
  }, [id]);

  // useEffect(() => {
  //   if (!isNewSession) return;

  //   editorstore.newSession();

  //   lastSavedTime.current = 0;
  //   setTimestamp(Date.now());
  // }, [isNewSession, nonce]);

  // useEffect(() => {
  //   if (!isOldSession) return;

  //   openSession(noteId);
  // }, [noteId]);

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
            {/* {previewSession.current && (
              <PreviewModeNotice
                {...previewSession.current}
                onDiscard={() => openSession(noteId)}
              />
            )} */}
            <Editor
              id={id}
              nonce={1}
              content={() =>
                previewSession.current?.content.data ||
                useEditorStore.getState().getSession(id, ["default"])?.content
                  ?.data
              }
              onPreviewDocument={(url) => setDocPreview(url)}
              onContentChange={() => (lastSavedTime.current = Date.now())}
              onSave={(content) => {
                const session = useEditorStore
                  .getState()
                  .getSession(id, ["default"]);
                console.log("ON SAVE", session);
                if (!session) return;
                deferredSave(id, id, session.sessionId, content);
              }}
              options={{
                readonly: isReadonly || isPreviewSession,
                onRequestFocus: () => toggleProperties(false),
                onLoadMedia: loadMedia,
                focusMode: isFocusMode,
                isMobile: isMobile || isTablet
              }}
            />
            <DropZone id={id} overlayRef={overlayRef} />
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
      {arePropertiesVisible && <Properties id={id} />}
      {isTOCVisible && <TableOfContents id={id} />}
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
  onLoadMedia?: () => void;
};
type EditorProps = {
  id: string;
  content: () => string | undefined;
  nonce?: number;
  options?: EditorOptions;
  onContentChange?: () => void;
  onSave?: OnChangeHandler;
  onPreviewDocument?: (preview: DocumentPreview) => void;
};
export function Editor(props: EditorProps) {
  const {
    id,
    onSave,
    content,
    nonce,
    options,
    onContentChange,
    onPreviewDocument
  } = props;
  const { readonly, headless, onLoadMedia, isMobile } = options || {
    headless: false,
    readonly: false,
    focusMode: false,
    isMobile: false
  };
  const [isLoading, setIsLoading] = useState(true);
  useScrollToBlock(id);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total, type }: AttachmentProgress) => {
        const editor = useEditorManager.getState().getEditor(id)?.editor;
        editor?.sendAttachmentProgress(
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
        attachmentType,
        src
      }: {
        groupId?: string;
        attachmentType: "image" | "webclip" | "generic";
        hash: string;
        src: string;
      }) => {
        const editor = useEditorManager.getState().getEditor(id)?.editor;
        if (groupId?.startsWith("monograph") || !editor) return;
        if (attachmentType === "image") {
          editor.loadImage(hash, src);
        } else if (attachmentType === "webclip") {
          editor.loadWebClip(hash, src);
        }
      }
    );

    return () => {
      event.unsubscribe();
      mediaAttachmentDownloadedEvent.unsubscribe();
    };
  }, []);

  return (
    <EditorChrome isLoading={isLoading} {...props}>
      <Tiptap
        id={id}
        isMobile={isMobile}
        nonce={nonce}
        readonly={readonly}
        content={content}
        downloadOptions={{
          corsHost: Config.get("corsProxy", "https://cors.notesnook.com")
        }}
        onLoad={() => {
          if (onLoadMedia) onLoadMedia();
          restoreSelection(id);
          restoreScrollPosition(id);
          setIsLoading(false);
        }}
        onSelectionChange={({ from, to }) =>
          Config.set(`${id}:selection`, { from, to })
        }
        onContentChange={onContentChange}
        onChange={onSave}
        onDownloadAttachment={(attachment) => saveAttachment(attachment.hash)}
        onPreviewAttachment={async (data) => {
          const { hash } = data;
          const attachment = await db.attachments.attachment(hash);
          if (attachment && attachment.mimeType.startsWith("image/")) {
            const container = document.getElementById("dialogContainer");
            if (!(container instanceof HTMLElement)) return;

            const dataurl =
              data.bloburl || (await downloadAttachment(hash, "base64"));
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
            const blob = await downloadAttachment(hash, "blob");
            if (!blob) return;
            onPreviewDocument({ url: URL.createObjectURL(blob), hash });
          }
        }}
        onInsertAttachment={(type) => {
          const mime = type === "file" ? "*/*" : "image/*";
          insertAttachment(mime).then((file) => {
            if (!file) return;
            // editor.attachFile(file);
          });
        }}
        onAttachFile={async (file) => {
          const result = await attachFile(file);
          if (!result) return;
          // editor.attachFile(result);
        }}
        onInsertInternalLink={async (attributes) => {
          const link = await showNoteLinkingDialog(attributes);
          console.log(link);
          return link;
        }}
      >
        {headless ? null : (
          <>
            <Titlebox id={id} readonly={readonly || false} />
            <Header id={id} readonly={readonly || false} />
          </>
        )}
      </Tiptap>
    </EditorChrome>
  );
}

function EditorChrome(
  props: PropsWithChildren<EditorProps & { isLoading: boolean }>
) {
  const { id, options, children, isLoading } = props;
  const { readonly, focusMode, headless, onRequestFocus, isMobile } =
    options || {
      headless: false,
      readonly: false,
      focusMode: false,
      isMobile: false
    };
  const editorMargins = useEditorStore((store) => store.editorMargins);

  if (headless) return <>{children}</>;

  return (
    <>
      {/* {isLoading ? (
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
      ) : null} */}

      {/* <Toolbar /> */}
      <FlexScrollContainer
        id={`${id}_editorScroll`}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1
          // minHeight: Config.get(`${id}:scroll-position`, 0) + 100
        }}
        onScroll={debounce((e) => {
          if (e.target instanceof HTMLElement) {
            const scrollTop = e.target.scrollTop;
            Config.set(`${id}:scroll-position`, scrollTop);
          }
        }, 500)}
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
          {/* {!isMobile && (
          
          )} */}
          {/* <Box
            id={`${id}_toolbar`}
            sx={{
              minHeight: 34,
              display: readonly ? "none" : "flex",
              bg: "background",
              position: "sticky",
              top: 0,
              mb: 1,
              zIndex: 2
            }}
          /> */}

          {/* <AnimatedFlex
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            sx={{ flex: 1 }}
          > */}
          {children}
          {/* </AnimatedFlex> */}
        </Flex>
      </FlexScrollContainer>
      {isMobile && (
        <Box
          id={`${id}_toolbar`}
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

// type PreviewModeNoticeProps = PreviewSession & {
//   onDiscard: () => void;
// };
// function PreviewModeNotice(props: PreviewModeNoticeProps) {
//   const { dateCreated, dateEdited, content, onDiscard } = props;
//   const disablePreviewMode = useCallback(
//     async (cancelled: boolean) => {
//       const { id, sessionId } = useEditorStore.getState().session;
//       if (!cancelled) {
//         await editorstore.saveSessionContent(id, sessionId, content);
//       }
//       onDiscard();
//     },
//     [onDiscard, content]
//   );

//   return (
//     <Flex
//       bg="var(--background-secondary)"
//       p={2}
//       sx={{ alignItems: "center", justifyContent: "space-between" }}
//       data-test-id="preview-notice"
//     >
//       <Flex mr={4} sx={{ flexDirection: "column" }}>
//         <Text variant={"subtitle"}>Preview</Text>
//         <Text variant={"body"}>
//           You are previewing note version edited from{" "}
//           {getFormattedDate(dateCreated, "date-time")} to{" "}
//           {getFormattedDate(dateEdited, "date-time")}.
//         </Text>
//       </Flex>
//       <Flex>
//         <Button
//           data-test-id="preview-notice-cancel"
//           variant={"secondary"}
//           mr={1}
//           px={4}
//           onClick={() => disablePreviewMode(true)}
//         >
//           Cancel
//         </Button>
//         <Button
//           variant="accent"
//           data-test-id="preview-notice-restore"
//           px={4}
//           onClick={async () => {
//             await disablePreviewMode(false);
//           }}
//         >
//           Restore
//         </Button>
//       </Flex>
//     </Flex>
//   );
// }

type DropZoneProps = {
  id: string;
  overlayRef: React.MutableRefObject<HTMLElement | undefined>;
};
function DropZone(props: DropZoneProps) {
  const { overlayRef, id } = props;

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
        const editor = useEditorManager.getState().getEditor(id)?.editor;
        if (!editor || !e.dataTransfer.files?.length) return;
        e.preventDefault();

        for (const file of e.dataTransfer.files) {
          const result = await attachFile(file);
          if (!result) continue;
          editor.attachFile(result);
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

function useScrollToBlock(id: string) {
  const blockId = useEditorStore(
    (store) => store.getSession(id)?.activeBlockId
  );
  useEffect(() => {
    if (!blockId) return;
    scrollIntoViewById(blockId);
    useEditorStore
      .getState()
      .updateSession(id, ["default", "unlocked", "deleted"], {
        activeBlockId: undefined
      });
  }, [blockId]);
}

function isFile(e: DragEvent) {
  return (
    e.dataTransfer &&
    (e.dataTransfer.files?.length > 0 ||
      e.dataTransfer.types?.some((a) => a === "Files"))
  );
}

function restoreScrollPosition(id: string) {
  const session = useEditorStore.getState().getActiveSession();
  if (session?.activeBlockId) return scrollIntoViewById(session.activeBlockId);

  const scrollContainer = document.getElementById(`${id}_editorScroll`);
  const scrollPosition = Config.get(`${id}:scroll-position`, 0);
  if (scrollContainer) {
    requestAnimationFrame(() => {
      if (scrollContainer.scrollHeight < scrollPosition)
        scrollContainer.style.minHeight = `${scrollPosition + 100}px`;
      scrollContainer.scrollTop = scrollPosition;
    });
  }
}

function restoreSelection(id: string) {
  const editor = useEditorManager.getState().getEditor(id)?.editor;
  editor?.focus({
    position: Config.get(`${id}:selection`, { from: 0, to: 0 })
  });
}
