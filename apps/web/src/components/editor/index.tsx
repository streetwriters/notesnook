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
  EditorSession
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
import useMobile from "../../hooks/use-mobile";
import Titlebox from "./title-box";
import useTablet from "../../hooks/use-tablet";
import Config from "../../utils/config";
import { ScopedThemeProvider } from "../theme-provider";
import { Lightbox } from "../lightbox";
import { Allotment } from "allotment";
import { showToast } from "../../utils/toast";
import { Item, MaybeDeletedItem, isDeleted } from "@notesnook/core/dist/types";
import { debounce, debounceWithId } from "@notesnook/common";
import { Freeze } from "react-freeze";
import { EditorActionBar } from "./action-bar";
import { UnlockView } from "../unlock";
import DiffViewer from "../diff-viewer";
import TableOfContents from "./table-of-contents";
import { showNoteLinkingDialog } from "../../common/dialog-controller";
import { scrollIntoViewById } from "@notesnook/editor";
import { IEditor } from "./types";

const PDFPreview = React.lazy(() => import("../pdf-preview"));

type DocumentPreview = {
  url?: string;
  hash: string;
};

function saveContent(noteId: string, ignoreEdit: boolean, content: string) {
  useEditorStore.getState().saveSessionContent(noteId, ignoreEdit, {
    type: "tiptap",
    data: content
  });
}
const deferredSave = debounceWithId(saveContent, 100);

export default function TabsView() {
  const sessions = useEditorStore((store) => store.sessions);
  const activeSessionId = useEditorStore((store) => store.activeSessionId);

  return (
    <>
      <EditorActionBar />
      {sessions.map((session) => (
        <Freeze
          key={session.id}
          freeze={session.needsHydration || session.id !== activeSessionId}
        >
          {session.type === "locked" ? (
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
            <MemoizedEditorView session={session} />
          )}
        </Freeze>
      ))}
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
  const [docPreview, setDocPreview] = useState<DocumentPreview>();

  const [dropRef, overlayRef] = useDragOverlay();
  const root = useRef<HTMLDivElement>(null);

  const arePropertiesVisible = useEditorStore(
    (store) => store.arePropertiesVisible
  );
  const isTOCVisible = useEditorStore((store) => store.isTOCVisible);
  const toggleProperties = useEditorStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const editor = useEditorManager((store) => store.editors[session.id]?.editor);

  const isMobile = useMobile();
  const isTablet = useTablet();

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
          lastChangedTime.current >= (item.dateEdited as number) ||
          !appstore.get().isRealtimeSyncEnabled
        )
          return;

        const { contentId } = session.note;
        const isContent = item.type === "tiptap" && item.id === contentId;
        const isNote = item.type === "note" && item.id === session.note.id;

        if (isContent) {
          if (!item.locked) return editor.updateContent(item.data);

          const result = await db.vault
            .decryptContent(item, item.noteId)
            .catch(() => EV.publish(EVENTS.vaultLocked));
          if (!result) return;
          editor.updateContent(result.data);
        } else if (isNote) {
          useEditorStore
            .getState()
            .updateSession(session.id, [session.type], { note: item });
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
    <ScopedThemeProvider ref={root} scope="editor" sx={{ flex: 1 }}>
      <div id="dialogContainer" />
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
            <Editor
              id={session.id}
              nonce={1}
              content={() => session.content?.data}
              editor={editor}
              session={session}
              onPreviewDocument={(url) => setDocPreview(url)}
              onContentChange={() => (lastChangedTime.current = Date.now())}
              onSave={(content, ignoreEdit) => {
                const data = content();
                if (!session.content)
                  session.content = { type: "tiptap", data };
                else session.content.data = data;
                deferredSave(session.id, session.id, ignoreEdit, data);
              }}
              options={{
                readonly: session?.type === "readonly",
                onRequestFocus: () => toggleProperties(false),
                focusMode: isFocusMode,
                isMobile: isMobile || isTablet
              }}
            />
            {editor && <DropZone editor={editor} overlayRef={overlayRef} />}
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
      {session.type !== "new" && (
        <>
          {arePropertiesVisible && <Properties session={session} />}
          {isTOCVisible && <TableOfContents session={session} />}
        </>
      )}
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
  id: string;
  session: EditorSession;
  content: () => string | undefined;
  editor?: IEditor;
  nonce?: number;
  options?: EditorOptions;
  onContentChange?: () => void;
  onSave?: OnChangeHandler;
  onPreviewDocument?: (preview: DocumentPreview) => void;
};
export function Editor(props: EditorProps) {
  const {
    id,
    editor,
    session,
    content,
    onSave,
    nonce,
    options,
    onContentChange,
    onPreviewDocument
  } = props;
  const { readonly, headless, isMobile } = options || {
    headless: false,
    readonly: false,
    focusMode: false,
    isMobile: false
  };
  const [isLoading, setIsLoading] = useState(true);
  useScrollToBlock(session);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total }: AttachmentProgress) => {
        editor?.sendAttachmentProgress(
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
        id={id}
        isMobile={isMobile}
        nonce={nonce}
        readonly={readonly}
        content={content}
        downloadOptions={{
          corsHost: Config.get("corsProxy", "https://cors.notesnook.com")
        }}
        onLoad={() => {
          if (editor) restoreSelection(editor, id);
          restoreScrollPosition(session);
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

function EditorChrome(
  props: PropsWithChildren<EditorProps & { isLoading: boolean }>
) {
  const { id, options, children } = props;
  const { focusMode, headless, onRequestFocus, isMobile } = options || {
    headless: false,
    readonly: false,
    focusMode: false,
    isMobile: false
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
        id={`editorScroll_${id}`}
        scrollRef={editorScrollRef}
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

type DropZoneProps = {
  overlayRef: React.MutableRefObject<HTMLElement | undefined>;
  editor: IEditor;
};
function DropZone(props: DropZoneProps) {
  const { overlayRef, editor } = props;

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
        if (!e.dataTransfer.files?.length) return;
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
    requestAnimationFrame(() => {
      if (scrollContainer.scrollHeight < scrollPosition)
        scrollContainer.style.minHeight = `${scrollPosition + 100}px`;
      scrollContainer.scrollTop = scrollPosition;
    });
  }
}

function restoreSelection(editor: IEditor, id: string) {
  editor.focus({
    position: Config.get(`${id}:selection`, { from: 0, to: 0 })
  });
}
