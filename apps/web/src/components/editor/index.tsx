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
  useState,
  useRef,
  PropsWithChildren,
  Suspense,
  useLayoutEffect
} from "react";
import ReactDOM from "react-dom";
import { Box, Flex, Progress, Text } from "@theme-ui/components";
import Properties from "../properties";
import {
  useEditorStore,
  SaveState,
  DefaultEditorSession,
  DeletedEditorSession,
  NewEditorSession,
  ReadonlyEditorSession,
  EditorSession,
  DocumentPreview
} from "../../stores/editor-store";
import {
  useStore as useAppStore,
  store as appstore
} from "../../stores/app-store";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import Tiptap, { OnChangeHandler } from "./tiptap";
import Header from "./header";
import { Attachment } from "../icons";
import { attachFiles, AttachmentProgress, insertAttachments } from "./picker";
import { useEditorManager } from "./manager";
import { saveAttachment, downloadAttachment } from "../../common/attachments";
import { EV, EVENTS } from "@notesnook/core/dist/common";
import { db } from "../../common/db";
import Titlebox from "./title-box";
import Config from "../../utils/config";
import { ScopedThemeProvider } from "../theme-provider";
import { Lightbox } from "../lightbox";
import { Allotment } from "allotment";
import { showToast } from "../../utils/toast";
import { Item, MaybeDeletedItem, isDeleted } from "@notesnook/core/dist/types";
import { debounce, debounceWithId } from "@notesnook/common";
import { Freeze } from "react-freeze";
import { UnlockView } from "../unlock";
import DiffViewer from "../diff-viewer";
import TableOfContents from "./table-of-contents";
import { showNoteLinkingDialog } from "../../common/dialog-controller";
import { scrollIntoViewById } from "@notesnook/editor";
import { IEditor } from "./types";
import { EditorActionBar } from "./action-bar";
import { logger } from "../../utils/logger";

const PDFPreview = React.lazy(() => import("../pdf-preview"));

function saveContent(noteId: string, ignoreEdit: boolean, content: string) {
  logger.debug("saving content", {
    noteId,
    ignoreEdit,
    length: content.length
  });
  useEditorStore.getState().saveSessionContent(noteId, ignoreEdit, {
    type: "tiptap",
    data: content
  });
}
const deferredSave = debounceWithId(saveContent, 100);

export default function TabsView() {
  const sessions = useEditorStore((store) => store.sessions);
  const documentPreview = useEditorStore((store) => store.documentPreview);
  const activeSessionId = useEditorStore((store) => store.activeSessionId);
  const arePropertiesVisible = useEditorStore(
    (store) => store.arePropertiesVisible
  );
  const isTOCVisible = useEditorStore((store) => store.isTOCVisible);
  const [dropRef, overlayRef] = useDragOverlay();

  return (
    <>
      {IS_DESKTOP_APP ? (
        ReactDOM.createPortal(
          <EditorActionBar />,
          document.getElementById("titlebar-portal-container")!
        )
      ) : (
        <Flex sx={{ px: 1 }}>
          <EditorActionBar />
        </Flex>
      )}

      <ScopedThemeProvider
        scope="editor"
        ref={dropRef}
        sx={{
          bg: "background",
          pt: 1,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Allotment
          proportionalLayout={true}
          onDragEnd={(sizes) => {
            Config.set("editor:panesize", sizes[1]);
          }}
        >
          <Allotment.Pane className="editor-pane">
            {sessions.map((session) => (
              <Freeze
                key={session.id}
                freeze={
                  session.needsHydration || session.id !== activeSessionId
                }
              >
                {session.type === "locked" ? (
                  <UnlockView
                    buttonTitle="Open note"
                    subtitle="Please enter the password to unlock this note."
                    title={session.note.title}
                    unlock={async (password) => {
                      const note = await db.vault.open(session.id, password);
                      if (!note || !note.content)
                        throw new Error("note with this id does not exist.");

                      useEditorStore.getState().addSession({
                        type: "default",
                        locked: true,
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
                  <MemoizedEditorView session={session} />
                )}
              </Freeze>
            ))}
          </Allotment.Pane>

          {documentPreview && (
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
                {documentPreview.url ? (
                  <Suspense
                    fallback={
                      <DownloadAttachmentProgress hash={documentPreview.hash} />
                    }
                  >
                    <PDFPreview
                      fileUrl={documentPreview.url}
                      hash={documentPreview.hash}
                      onClose={() =>
                        useEditorStore.setState({ documentPreview: undefined })
                      }
                    />
                  </Suspense>
                ) : (
                  <DownloadAttachmentProgress hash={documentPreview.hash} />
                )}
              </ScopedThemeProvider>
            </Allotment.Pane>
          )}
        </Allotment>
        <DropZone overlayRef={overlayRef} />
        {arePropertiesVisible && activeSessionId && (
          <Properties sessionId={activeSessionId} />
        )}
        {isTOCVisible && activeSessionId && (
          <TableOfContents sessionId={activeSessionId} />
        )}
      </ScopedThemeProvider>
    </>
  );
}

const MemoizedEditorView = React.memo(
  EditorView,
  (prev, next) =>
    prev.session.id === next.session.id &&
    prev.session.type === next.session.type
);
function EditorView({
  session
}: {
  session:
    | DefaultEditorSession
    | NewEditorSession
    | ReadonlyEditorSession
    | DeletedEditorSession;
}) {
  const lastChangedTime = useRef<number>(Date.now());
  const root = useRef<HTMLDivElement>(null);

  const toggleProperties = useEditorStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const editor = useEditorManager((store) => store.editors[session.id]?.editor);

  useEffect(() => {
    const event = db.eventManager.subscribe(
      EVENTS.syncItemMerged,
      async (item?: MaybeDeletedItem<Item>) => {
        if (
          session.type === "new" ||
          !editor ||
          !session.note ||
          !item ||
          isDeleted(item) ||
          (item.type !== "tiptap" && item.type !== "note") ||
          !appstore.get().isRealtimeSyncEnabled
        ) {
          console.log("ignoring real time sync");
          return;
        }

        const isContent =
          item.type === "tiptap" && item.noteId === session.note.id;
        const isNote = item.type === "note" && item.id === session.note.id;
        if (isContent && lastChangedTime.current < item.dateEdited) {
          if (!item.locked) return editor.updateContent(item.data);

          const result = await db.vault
            .decryptContent(item, item.noteId)
            .catch(() => EV.publish(EVENTS.vaultLocked));
          if (!result) return;
          editor.updateContent(result.data);
        } else if (isNote && session.note.title !== item.title) {
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
  }, [editor, session]);

  useLayoutEffect(() => {
    editor?.focus();

    const element = root.current;
    element?.classList.add("active");
    return () => {
      element?.classList.remove("active");
    };
  }, [editor]);

  return (
    <Flex
      ref={root}
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
      <div className="dialogContainer" />
      <Editor
        id={session.id}
        nonce={1}
        content={() => session.content?.data}
        session={session}
        onPreviewDocument={(preview) =>
          useEditorStore.setState({ documentPreview: preview })
        }
        onContentChange={() => (lastChangedTime.current = Date.now())}
        onSave={(content, ignoreEdit) => {
          const data = content();
          if (!session.content) session.content = { type: "tiptap", data };
          else session.content.data = data;
          logger.debug("scheduling save", {
            id: session.id,
            length: data.length
          });
          deferredSave(session.id, session.id, ignoreEdit, data);
        }}
        options={{
          readonly: session?.type === "readonly" || session?.type === "deleted",
          onRequestFocus: () => toggleProperties(false),
          focusMode: isFocusMode
        }}
      />
    </Flex>
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
  headless?: boolean;
  readonly?: boolean;
  focusMode?: boolean;
  onRequestFocus?: () => void;
};
type EditorProps = {
  id: string;
  session: EditorSession;
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
    session,
    content,
    onSave,
    nonce,
    options,
    onContentChange,
    onPreviewDocument
  } = props;
  const { readonly, headless } = options || {
    headless: false,
    readonly: false,
    focusMode: false
  };
  useScrollToBlock(session);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total }: AttachmentProgress) => {
        const editor = useEditorManager.getState().getEditor(id)?.editor;
        editor?.sendAttachmentProgress(
          hash,
          Math.round((loaded / total) * 100)
        );
      }
    );

    return () => {
      event.unsubscribe();
    };
  }, [id]);

  return (
    <EditorChrome {...props}>
      <Tiptap
        id={id}
        nonce={nonce}
        readonly={readonly}
        content={content}
        downloadOptions={{
          corsHost: Config.get("corsProxy", "https://cors.notesnook.com")
        }}
        onLoad={(editor) => {
          restoreSelection(editor, id);
          restoreScrollPosition(session);
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
        onInsertAttachment={async (type) => {
          const mime = type === "file" ? "*/*" : "image/*";
          const attachments = await insertAttachments(mime);
          const editor = useEditorManager.getState().getEditor(id)?.editor;

          if (!attachments) return;
          for (const attachment of attachments) {
            editor?.attachFile(attachment);
          }
        }}
        onGetAttachmentData={(attachment) => {
          return downloadAttachment(
            attachment.hash,
            attachment.type === "web-clip" ? "text" : "base64",
            id?.toString()
          );
        }}
        onAttachFiles={async (files) => {
          const editor = useEditorManager.getState().getEditor(id)?.editor;
          const result = await attachFiles(files);
          if (!result) return;
          result.forEach((attachment) => editor?.attachFile(attachment));
        }}
        onInsertInternalLink={async (attributes) => {
          const link = await showNoteLinkingDialog(attributes);
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

function EditorChrome(props: PropsWithChildren<EditorProps>) {
  const { id, options, children } = props;
  const { focusMode, headless, onRequestFocus } = options || {
    headless: false,
    readonly: false,
    focusMode: false
  };
  const editorMargins = useEditorStore((store) => store.editorMargins);
  const editorContainerRef = useRef<HTMLElement>(null);
  const editorScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!editorScrollRef.current) return;
    function onResize(
      entries: ResizeObserverEntry[],
      _observer: ResizeObserver
    ) {
      const editor = editorContainerRef.current?.querySelector(
        ".ProseMirror"
      ) as HTMLElement | undefined;
      const parent = editorScrollRef.current?.getBoundingClientRect();
      const child = editorContainerRef.current?.getBoundingClientRect();
      if (!parent || !child || !editor || entries.length <= 0) return;

      const CONTAINER_MARGIN = 30;
      const negativeSpace = Math.abs(
        parent.left - child.left - CONTAINER_MARGIN
      );

      editor.style.marginLeft = `-${negativeSpace}px`;
      editor.style.marginRight = `-${negativeSpace}px`;
      editor.style.paddingLeft = `${negativeSpace}px`;
      editor.style.paddingRight = `${negativeSpace}px`;
    }
    const observer = new ResizeObserver(debounce(onResize, 500));
    observer.observe(editorScrollRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (headless) return <>{children}</>;

  return (
    <>
      <FlexScrollContainer
        id={`editorScroll_${id}`}
        scrollRef={editorScrollRef}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1
        }}
        suppressScrollX
        onScroll={debounce((e) => {
          if (e.target instanceof HTMLElement) {
            const scrollTop = e.target.scrollTop;
            Config.set(`${id}:scroll-position`, scrollTop);
          }
        }, 500)}
      >
        <Flex
          ref={editorContainerRef}
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: ["stretch", focusMode ? "center" : "stretch", "center"],
            maxWidth: editorMargins ? "min(100%, 850px)" : "auto",
            width: "100%"
          }}
          pl={6}
          pr={6}
          onClick={onRequestFocus}
        >
          {children}
        </Flex>
      </FlexScrollContainer>
    </>
  );
}

type DropZoneProps = {
  overlayRef: React.MutableRefObject<HTMLElement | undefined>;
};
function DropZone(props: DropZoneProps) {
  const { overlayRef } = props;

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
        const { activeEditorId, getEditor } = useEditorManager.getState();
        const editor = getEditor(activeEditorId || "")?.editor;
        if (!e.dataTransfer.files?.length || !editor) return;

        e.preventDefault();
        const attachments = await attachFiles(Array.from(e.dataTransfer.files));
        for (const attachment of attachments || []) {
          editor.attachFile(attachment);
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
  const dropElementRef = useRef<HTMLDivElement>(null);
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

function useScrollToBlock(session: EditorSession) {
  const blockId = useEditorStore(
    (store) => store.getSession(session.id)?.activeBlockId
  );
  useEffect(() => {
    if (!blockId) return;
    scrollIntoViewById(blockId);
    useEditorStore.getState().updateSession(session.id, [session.type], {
      activeBlockId: undefined
    });
  }, [session.id, session.type, blockId]);
}

function isFile(e: DragEvent) {
  return (
    e.dataTransfer &&
    (e.dataTransfer.files?.length > 0 ||
      e.dataTransfer.types?.some((a) => a === "Files"))
  );
}

function restoreScrollPosition(session: EditorSession) {
  if (session?.activeBlockId) return scrollIntoViewById(session.activeBlockId);

  const scrollContainer = document.getElementById(`editorScroll_${session.id}`);
  const scrollPosition = Config.get(`${session.id}:scroll-position`, 0);
  if (scrollContainer) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (scrollContainer.scrollHeight < scrollPosition)
          scrollContainer.style.minHeight = `${scrollPosition + 100}px`;
        scrollContainer.scrollTop = scrollPosition;
      });
    });
  }
}

function restoreSelection(editor: IEditor, id: string) {
  editor.focus({
    position: Config.get(`${id}:selection`, { from: 0, to: 0 })
  });
}
