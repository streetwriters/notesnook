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

const ReactMCE = React.lazy(() => import("./tinymce"));
// const EMPTY_CONTENT = "<p><br></p>";
function editorSetContent(editor, content) {
  const editorScroll = document.querySelector(".editorScroll");
  if (editorScroll) editorScroll.scrollTop = 0;

  editor.setHTML(content);

  updateWordCount(editor);

  editor.focus();
}

function updateWordCount(editor) {
  if (!editor.countWords) return;
  AppEventManager.publish(AppEvents.UPDATE_WORD_COUNT, editor.countWords());
}

function onEditorChange(noteId, sessionId, content) {
  if (!content) return;

  editorstore.get().saveSessionContent(noteId, sessionId, {
    type: "tiny",
    data: content,
  });
}
const debouncedUpdateWordCount = debounce(updateWordCount, 1000);
const debouncedOnEditorChange = debounceWithId(onEditorChange, 100);

function Editor({ noteId, nonce }) {
  const editorRef = useRef();
  const [isEditorLoading, setIsEditorLoading] = useState(true);
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
  const isSessionReady = useMemo(
    () => nonce || sessionId || editorRef.current?.editor?.initialized,
    [nonce, sessionId, editorRef]
  );

  useEffect(() => {
    init();
  }, [init]);

  const startSession = useCallback(
    async function startSession(noteId, force) {
      if (noteId === 0) newSession(nonce);
      else if (noteId) {
        await openSession(noteId, force);
      }
    },
    [newSession, openSession, nonce]
  );

  const clearContent = useCallback(() => {
    const editor = editorRef.current?.editor;
    if (!editor || !editor.initialized) return;
    editor.clearContent();
    updateWordCount(editor);
    editor.focus(); // TODO
  }, []);

  const setContent = useCallback(() => {
    const { id } = editorstore.get().session;
    const editor = editorRef.current?.editor;
    if (!editor || !editor.initialized) return;

    async function setContents() {
      if (!db.notes.note(id)?.synced()) {
        await showError(
          "Note not synced",
          "This note is not fully synced. Please sync again to open this note for editing."
        );
        return;
      }

      let content = await editorstore.get().getSessionContent();
      if (content?.data) editorSetContent(editor, content.data);
      else clearContent(editor);

      editorstore.set((state) => (state.session.state = SESSION_STATES.stale));
      if (id && content) await db.attachments.downloadImages(id);
    }
    setContents();
  }, [clearContent]);

  const enabledPreviewMode = useCallback(() => {
    const editor = editorRef.current?.editor;
    editor.mode.set("readonly");
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
      setContent();
    },
    [sessionId, contentId, setContent]
  );

  useEffect(
    function openPreviewSession() {
      if (!isPreviewMode || sessionState !== SESSION_STATES.new) return;

      setContent();
      enabledPreviewMode();
    },
    [isPreviewMode, sessionState, setContent, enabledPreviewMode]
  );

  useEffect(() => {
    if (isEditorLoading) return;
    const editor = editorRef.current?.editor;
    if (isReadonly) {
      editor.mode.set("readonly");
    } else {
      editor.mode.set("design");
    }
  }, [isReadonly, isEditorLoading]);

  useEffect(
    function newSession() {
      if (!nonce) return;

      clearContent();
    },
    [nonce, clearContent]
  );

  useEffect(() => {
    (async () => {
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
      {isEditorLoading ? (
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
              <ReactMCE
                editorRef={editorRef}
                onFocus={() => toggleProperties(false)}
                onSave={saveSession}
                sessionId={sessionId}
                onChange={(content, editor) => {
                  const { id, sessionId } = editorstore.get().session;
                  debouncedOnEditorChange(id, id, sessionId, content);
                  debouncedUpdateWordCount(editor);
                }}
                changeInterval={100}
                onInit={(editor) => {
                  if (sessionId && editorstore.get().session.contentId) {
                    setContent();
                  } else if (nonce) clearContent();

                  setTimeout(() => {
                    setIsEditorLoading(false);
                    // a short delay to make sure toolbar has rendered.
                  }, 100);
                }}
              />
            </Suspense>
          )}
        </Flex>
      </FlexScrollContainer>
      {arePropertiesVisible && <Properties noteId={noteId} />}
    </Flex>
  );
}
export default Editor;

function Notice({ title, subtitle, onCancel, action }) {
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
