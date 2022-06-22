import { useEffect, useCallback, useState, useRef } from "react";
import { Box, Button, Flex, Text } from "rebass";
import Properties from "../properties";
import { useStore, store as editorstore } from "../../stores/editor-store";
import Toolbar from "./toolbar";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import { formatDate } from "notes-core/utils/date";
import { debounce, debounceWithId } from "../../utils/debounce";
import { CharacterCounter } from "./types";
import Tiptap from "./tiptap";
import Header from "./header";
import { Attachment } from "../icons";
import { useEditorInstance } from "./context";
import {
  attachFile,
  AttachmentProgress,
  insertAttachment,
} from "./plugins/picker";
import { DropEvent } from "react-dropzone";
import { downloadAttachment } from "../../common/attachments";
import { EV, EVENTS } from "notes-core/common";
import { db } from "../../common/db";

function updateWordCount(counter?: CharacterCounter) {
  AppEventManager.publish(
    AppEvents.UPDATE_WORD_COUNT,
    counter ? counter.words() : 0
  );
}

function onEditorChange(noteId: string, sessionId: string, content: string) {
  if (!content) return;

  editorstore.get().saveSessionContent(noteId, sessionId, {
    type: "tiny",
    data: content,
  });
}
const debouncedUpdateWordCount = debounce(updateWordCount, 1000);
const debouncedOnEditorChange = debounceWithId(onEditorChange, 100);

export default function EditorManager({
  noteId,
  nonce,
}: {
  noteId: string | number;
  nonce?: string;
}) {
  const isNewSession = !!nonce && noteId === 0;
  const isOldSession = !nonce && !!noteId;

  const [content, setContent] = useState<string>("");
  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isPreviewMode = useStore(
    (store) => store.session.sessionType === "preview"
  );
  const isReadonly = useStore(
    (store) => store.session.readonly || isPreviewMode
  );
  const [dropRef, overlayRef] = useDragOverlay();
  const editor = useEditorInstance();
  // TODO move this somewhere more appropriate
  // const init = useStore((store) => store.init);

  useEffect(() => {
    if (!isNewSession) return;
    (async function () {
      await editorstore.newSession(nonce);
      setContent("");
    })();
  }, [isNewSession, nonce]);

  useEffect(() => {
    if (!noteId) return;

    (async function () {
      const content = await editorstore.get().getSessionContent();
      setContent(content?.data);
      if (noteId && content) await db.attachments?.downloadImages(noteId);
    })();
  }, [noteId, isPreviewMode]);

  useEffect(() => {
    if (!isOldSession) return;

    (async function () {
      await editorstore.openSession(noteId);

      let content = await editorstore.get().getSessionContent();
      setContent(content?.data);
      // editorstore.set(
      //   (state: any) => (state.session.state = SESSION_STATES.stale)
      // );
      if (noteId && content) await db.attachments?.downloadImages(noteId);
    })();
  }, [noteId, isOldSession]);

  return (
    <Flex
      ref={dropRef}
      flexDirection="column"
      id="editorContainer"
      flex={1}
      sx={{
        position: "relative",
        alignSelf: "stretch",
        overflow: "hidden",
      }}
    >
      {isPreviewMode && <PreviewModeNotice />}
      <Editor
        content={content}
        readonly={isReadonly}
        onRequestFocus={() => toggleProperties(false)}
      />
      {arePropertiesVisible && <Properties />}

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
          display: "none",
        }}
        onDrop={async (e) => {
          if (!editor) return;
          for (let file of e.dataTransfer.files) {
            const result = await attachFile(file);
            if (!result) continue;
            editor.attachFile(result);
          }
        }}
      >
        <Flex
          sx={{
            border: "2px dashed var(--fontTertiary)",
            borderRadius: "default",
            p: 70,
            flexDirection: "column",
            pointerEvents: "none",
          }}
        >
          <Attachment size={72} />
          <Text variant={"heading"} sx={{ color: "icon", mt: 2 }}>
            Drop your files here to attach
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}

type EditorProps = {
  readonly?: boolean;
  focusMode?: boolean;
  content: string;
  onRequestFocus?: () => void;
};
function Editor({ content, readonly, focusMode, onRequestFocus }: EditorProps) {
  const editor = useEditorInstance();

  useEffect(() => {
    if (!editor) return;

    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, loaded, total, type }: AttachmentProgress) => {
        editor.sendAttachmentProgress(
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
        src,
      }: {
        groupId?: string;
        hash: string;
        src: string;
      }) => {
        if (groupId?.startsWith("monograph")) return;
        editor.loadImage(hash, src);
      }
    );

    return () => {
      event.unsubscribe();
      mediaAttachmentDownloadedEvent.unsubscribe();
    };
  }, [editor]);

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
          }}
          maxWidth={focusMode ? "min(100%, 850px)" : "935px"}
          width="100%"
          px={[2, 2, 35]}
          onClick={onRequestFocus}
          // mt={[2, 2, 25]}
        >
          <Box
            id="editorToolbar"
            sx={{
              display: readonly ? "none" : "flex",
              bg: "background",
              position: "sticky",
              top: 0,
              mb: 1,
              zIndex: 2,
            }}
          />
          <Header readonly={readonly} />
          <Tiptap
            readonly={readonly}
            toolbarContainerId="editorToolbar"
            content={content}
            onChange={(content, counter) => {
              const { id, sessionId } = editorstore.get().session;
              debouncedOnEditorChange(sessionId, id, sessionId, content);
              if (counter) debouncedUpdateWordCount(counter);
            }}
            onDownloadAttachment={(attachment) =>
              downloadAttachment(attachment.hash)
            }
            onInsertAttachment={(type) => {
              const mime = type === "file" ? "*/*" : "image/*";
              insertAttachment(mime).then((file) => {
                if (!file) return;
                editor?.attachFile(file);
              });
            }}
          />
        </Flex>
      </FlexScrollContainer>

      {/* TODO <Box
        id="editorToolbar"
        sx={{
          display: readonly ? "none" : "flex",
          bg: "background",
          position: "sticky",
          top: 0,
          mb: 1,
          zIndex: 2,
          px: [2, 2, 35],
        }}
      /> */}
    </>
  );
}

function PreviewModeNotice() {
  const disablePreviewMode = useCallback(async (cancelled) => {
    const { id, sessionId, content } = editorstore.get().session;
    if (!cancelled) {
      await editorstore.saveSessionContent(id, sessionId, content);
    }
    await editorstore.openSession(id, true);
  }, []);

  return (
    <Flex
      bg="bgSecondary"
      p={2}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Flex flexDirection={"column"} mr={4}>
        <Text variant={"subtitle"}>Preview</Text>
        <Text variant={"body"}>
          You are previewing note version edited from{" "}
          {formatDate(editorstore.get().session.dateCreated)} to{" "}
          {formatDate(editorstore.get().session.dateEdited)}.
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

function useDragOverlay() {
  const dropElementRef = useRef<HTMLElement>();
  const overlayRef = useRef<HTMLElement>();

  useEffect(() => {
    const dropElement = dropElementRef.current;
    const overlay = overlayRef.current;

    if (!dropElement || !overlay) return;

    function isFile(e: DragEvent) {
      return (
        e.dataTransfer &&
        (e.dataTransfer.files.length > 0 ||
          e.dataTransfer.types.some((a) => a === "Files"))
      );
    }

    function showOverlay(e: DragEvent) {
      if (!overlay || !isFile(e)) return;

      overlay.style.display = "flex";
    }

    function hideOverlay(e: DragEvent | DropEvent) {
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
