import React, {
  useEffect,
  useRef,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Box, Button, Flex, Text } from "rebass";
import Properties from "../properties";
import {
  useStore,
  SESSION_STATES,
  store as editorstore,
} from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import Header from "./header";
import Toolbar from "./toolbar";
import EditorLoading from "./loading";
import { db } from "../../common/db";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import { formatDate } from "notes-core/utils/date";
import { debounce, debounceWithId } from "../../utils/debounce";
import { showError } from "../../common/dialog-controller";
import "./tiptap.css";
import { CharacterCounter, IEditor } from "./tiptap";

const ReactMCE = React.lazy(() => import("./tinymce"));
const TipTap = React.lazy(() => import("./tiptap"));
// const EMPTY_CONTENT = "<p><br></p>";
// function editorSetContent(editor, content) {
//   const editorScroll = document.querySelector(".editorScroll");
//   if (editorScroll) editorScroll.scrollTop = 0;

//   editor.setHTML(content);

//   updateWordCount(editor);

//   editor.focus();
// }

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

function Editor({
  noteId,
  nonce,
}: {
  noteId?: string | number;
  nonce?: string;
}) {
  const sessionId = useStore((store) => store.session.id);
  const sessionState = useStore((store) => store.session.state);
  const sessionType = useStore((store) => store.session.sessionType);
  const isPreviewMode = sessionType === "preview";
  const isReadonly = useStore(
    (store) => store.session.readonly || isPreviewMode
  );
  const contentId = useStore((store) => store.session.contentId);
  const saveSession = useStore((store) => store.saveSession);
  const newSession = useStore((store) => store.newSession);
  const openSession = useStore((store) => store.openSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const init = useStore((store) => store.init);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isSessionReady = useMemo(() => nonce || sessionId, [nonce, sessionId]);
  const [editor, setEditor] = useState<IEditor>();
  // const editor = useRef<IEditor>();
  // const [content, setContent] = useState<string>();
  // const [isEditorFocused, setIsEditorFocused] = useState<boolean>();

  useEffect(() => {
    init();
  }, [init]);

  const startSession = useCallback(
    async function startSession(noteId: string | number, force?: boolean) {
      if (noteId === 0) newSession(nonce);
      else if (noteId) {
        await openSession(noteId, force);
      }
    },
    [newSession, openSession, nonce]
  );

  const clearContent = useCallback(() => {
    if (!editor) return;
    editor.clearContent();
    editor.focus();
    updateWordCount();
  }, [editor]);

  const setEditorContent = useCallback(() => {
    const { id } = editorstore.get().session;
    async function setContents() {
      if (!editor) return;
      // TODO move this somewhere more appropriate
      if (!db.notes?.note(id)?.synced()) {
        await showError(
          "Note not synced",
          "This note is not fully synced. Please sync again to open this note for editing."
        );
        return;
      }

      let content = await editorstore.get().getSessionContent();
      if (content?.data) {
        editor.setContent(content.data);
        editor.focus();
      } else clearContent();

      editorstore.set(
        (state: any) => (state.session.state = SESSION_STATES.stale)
      );
      if (id && content) await db.attachments?.downloadImages(id);
    }
    setContents();
  }, [clearContent, editor]);

  const enabledPreviewMode = useCallback(() => {
    //   const editor = editorRef.current?.editor;
    //   editor.mode.set("readonly");
  }, []);

  const disablePreviewMode = useCallback(
    async (cancelled) => {
      const { id, sessionId, content } = editorstore.get().session;
      if (!cancelled) {
        await editorstore.get().saveSessionContent(id, sessionId, content);
      }
      await startSession(id, true);
    },
    [startSession]
  );

  useEffect(
    function clearSession() {
      // clearSession makes sessionId && contentId both undefined
      if (!sessionId && !contentId) clearContent();
    },
    [sessionId, contentId, clearContent]
  );

  useEffect(
    function openSession() {
      const { title, nonce } = editorstore.get().session;
      // there can be notes that only have a title so we need to
      // handle that.
      if (!contentId && (!title || !!nonce)) return;
      setEditorContent();
    },
    [sessionId, contentId, setEditorContent]
  );

  useEffect(
    function openPreviewSession() {
      if (!isPreviewMode || sessionState !== SESSION_STATES.new) return;

      setEditorContent();
      enabledPreviewMode();
    },
    [isPreviewMode, sessionState, setEditorContent, enabledPreviewMode]
  );

  //   useEffect(() => {
  //     if (isEditorLoading) return;
  //     const editor = editorRef.current?.editor;
  //     if (!editor) return;
  //     if (isReadonly) {
  //       editor.mode.set("readonly");
  //     } else {
  //       editor.mode.set("design");
  //     }
  //   }, [isReadonly, isEditorLoading]);

  useEffect(
    function newSession() {
      if (!nonce) return;

      clearContent();
    },
    [nonce, clearContent]
  );

  useEffect(() => {
    (async () => {
      if (noteId === undefined) return;
      await startSession(noteId);
    })();
  }, [startSession, noteId, nonce]);

  return (
    <Flex
      flexDirection="column"
      id="editorContainer"
      flex={1}
      sx={{
        position: "relative",
        alignSelf: "stretch",
        overflow: "hidden",
      }}
    >
      {!editor ? (
        <Flex
          sx={{
            position: "absolute",
            width: "full",
            height: "full",
            bg: "background",
            zIndex: 999,
          }}
        >
          <EditorLoading />
        </Flex>
      ) : null}
      <Toolbar />
      <FlexScrollContainer
        className="editorScroll"
        style={{}}
        viewStyle={{ display: "flex", flexDirection: "column" }}
      >
        <Box
          id="editorToolbar"
          sx={{
            display: isReadonly ? "none" : "flex",
            bg: "background",
            position: "sticky",
            top: 0,
            zIndex: 2,
            borderBottom: "1px solid",
            borderBottomColor: "border",
            justifyContent: "center",
            alignItems: "center",
            py: 1,
          }}
        />
        {isPreviewMode && (
          <Notice
            title={"Preview"}
            subtitle={`You are previewing note version edited from ${formatDate(
              editorstore.get().session.dateCreated
            )} to ${formatDate(editorstore.get().session.dateEdited)}.`}
            onCancel={() => disablePreviewMode(true)}
            action={{
              text: "Restore",
              onClick: async () => {
                await disablePreviewMode(false);
                await editorstore.get().saveSession();
              },
            }}
          />
        )}
        <Flex
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: [
              "stretch",
              isFocusMode ? "center" : "stretch",
              "center",
            ],
          }}
          maxWidth={isFocusMode ? "min(100%,850px)" : "935px"}
          width="100%"
          px={[2, 2, 35]}
          mt={[2, 2, 25]}
        >
          <Header readonly={isReadonly} />

          {isSessionReady && (
            <Suspense fallback={<div />}>
              <TipTap
                onFocus={() => {
                  toggleProperties(false);
                }}
                onInit={(_editor) => {
                  setEditor(_editor);
                }}
                onDestroy={() => {
                  setEditor(undefined);
                }}
                onChange={(content, counter) => {
                  const { id, sessionId } = editorstore.get().session;
                  debouncedOnEditorChange(sessionId, id, sessionId, content);
                  if (counter) debouncedUpdateWordCount(counter);
                }}
              />
            </Suspense>
          )}
        </Flex>
      </FlexScrollContainer>
      {arePropertiesVisible && <Properties />}
    </Flex>
  );
}
export default Editor;

function Notice({
  title,
  subtitle,
  onCancel,
  action,
}: {
  title: string;
  subtitle: string;
  onCancel: () => void;
  action?: {
    text: string;
    onClick: () => void;
  };
}) {
  return (
    <Flex
      bg="bgSecondary"
      p={2}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Flex flexDirection={"column"} mr={4}>
        <Text variant={"subtitle"}>{title}</Text>
        <Text variant={"body"}>{subtitle}</Text>
      </Flex>
      <Flex>
        {onCancel && (
          <Button
            data-test-id="editor-notice-cancel"
            variant={"secondary"}
            mr={1}
            px={4}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        {action && (
          <Button
            data-test-id="editor-notice-action"
            px={4}
            onClick={action.onClick}
          >
            {action.text}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
