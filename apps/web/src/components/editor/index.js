import React, {
  useEffect,
  useRef,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Flex } from "rebass";
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
import { AppEventManager, AppEvents } from "../../common";
import debounce from "just-debounce-it";
import { FlexScrollContainer } from "../scroll-container";

const ReactMCE = React.lazy(() => import("./tinymce"));

function editorSetContent(editor, content) {
  const editorScroll = document.querySelector(".editorScroll");
  if (editorScroll) editorScroll.scrollTop = 0;

  editor.setHTML(content);

  updateWordCount(editor);
}

function updateWordCount(editor) {
  if (!editor.countWords) return;
  AppEventManager.publish(AppEvents.UPDATE_WORD_COUNT, editor.countWords());
}
const debouncedUpdateWordCount = debounce(updateWordCount, 1000);

function Editor({ noteId, nonce }) {
  const editorRef = useRef();
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const sessionId = useStore((store) => store.session.id);
  const contentId = useStore((store) => store.session.contentId);
  const contentType = useStore((store) => store.session.content?.type);
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
    async function startSession(noteId) {
      if (noteId === 0) newSession(nonce);
      else if (noteId) {
        await openSession(noteId);
      }
    },
    [newSession, openSession, nonce]
  );

  const setContent = useCallback(() => {
    const {
      id,
      content: { data },
    } = editorstore.get().session;
    const editor = editorRef.current?.editor;
    if (!editor || !editor.initialized) return;

    async function setContents() {
      editorSetContent(editor, data);

      editorstore.set((state) => (state.session.state = SESSION_STATES.stale));
      if (id) await db.attachments.downloadImages(id);
    }
    setContents();
  }, []);

  const clearContent = useCallback(() => {
    const editor = editorRef.current?.editor;
    if (!editor || !editor.initialized) return;
    editor.clearContent();
  }, []);

  useEffect(
    function clearSession() {
      // clearSession makes sessionId && contentId both undefined
      if (!sessionId && !contentId) clearContent();
    },
    [sessionId, contentId, clearContent]
  );

  useEffect(
    function openSesion() {
      if (!contentId) return;
      setContent();
    },
    [sessionId, contentId, setContent, clearContent]
  );

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
      <FlexScrollContainer>
        <Flex
          variant="columnFill"
          className="editorScroll"
          flexDirection="column"
          overflow="hidden"
          overflowY="auto"
        >
          <Flex
            id="editorToolbar"
            sx={{
              bg: "background",
              position: "sticky",
              top: 0,
              zIndex: 2,
              borderBottom: "1px solid",
              borderBottomColor: "border",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "39px",
            }}
          />
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
            <Header />

            {isSessionReady && (
              <Suspense fallback={<div />}>
                {contentType === "tiny" ? (
                  <>
                    <ReactMCE
                      editorRef={editorRef}
                      onFocus={() => toggleProperties(false)}
                      onSave={saveSession}
                      sessionId={sessionId}
                      onChange={(content, editor) => {
                        if (!content || content === "<p><br></pr>") return;

                        editorstore.get().setSessionContent({
                          type: "tiny",
                          data: content,
                        });

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
                  </>
                ) : null}
              </Suspense>
            )}
          </Flex>
        </Flex>
      </FlexScrollContainer>
      {arePropertiesVisible && <Properties noteId={noteId} />}
    </Flex>
  );
}
export default Editor;
