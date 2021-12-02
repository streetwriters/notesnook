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
import { AnimatedFlex } from "../animated";
import Header from "./header";
import useMobile from "../../utils/use-mobile";
import useTablet from "../../utils/use-tablet";
import Toolbar from "./toolbar";
import EditorLoading from "./loading";
import { db } from "../../common/db";

const ReactMCE = React.lazy(() => import("./tinymce"));

function Editor({ noteId, nonce }) {
  const editorRef = useRef();
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const sessionId = useStore((store) => store.session.id);
  const contentType = useStore((store) => store.session.content?.type);
  const setSession = useStore((store) => store.setSession);
  const saveSession = useStore((store) => store.saveSession);
  const newSession = useStore((store) => store.newSession);
  const openSession = useStore((store) => store.openSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const updateWordCount = useStore((store) => store.updateWordCount);
  const init = useStore((store) => store.init);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isSessionReady = useMemo(
    () => nonce || sessionId || editorRef.current?.editor?.initialized,
    [nonce, sessionId, editorRef]
  );

  useEffect(() => {
    init();
  }, [init]);

  const startSession = useCallback(
    async function startSession(noteId) {
      console.log("starting session", nonce, noteId);
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
    if (!editor) return;

    async function setContents() {
      if (!editor.initialized) return;
      editor.setContent(data, { format: "html" });

      editor.undoManager.reset();
      editor.setDirty(false);

      editorstore.set((state) => (state.session.state = SESSION_STATES.stale));
      if (id) await db.attachments.downloadImages(id);

      editor.focus();
    }

    setContents();
  }, []);

  const clearContent = useCallback(() => {
    const editor = editorRef.current?.editor;
    console.log(editor);
    if (!editor) return;

    async function clearContents() {
      if (!editor.initialized) return;
      editor.setContent("<p><br/></p>", { format: "html" });
      editor.undoManager.reset();
      editor.setDirty(false);

      editor.focus();
    }

    clearContents();
  }, []);

  useEffect(() => {
    if (!sessionId || !editorstore.get().session.contentId) return;
    setContent();
  }, [sessionId, setContent]);

  useEffect(() => {
    if (!nonce) return;

    clearContent();
  }, [nonce, clearContent]);

  useEffect(() => {
    (async () => {
      await startSession(noteId);
    })();
  }, [startSession, noteId, nonce]);

  // if (!isSessionReady) return <EditorLoading />;
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
          }}
        />
        <AnimatedFlex
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: ["stretch", "stretch", "center"],
          }}
          animate={{
            paddingRight:
              isFocusMode && !isTablet
                ? "25%"
                : isTablet || isMobile
                ? "10px"
                : "35px",
            paddingLeft:
              isFocusMode && !isTablet
                ? "25%"
                : isTablet || isMobile
                ? "10px"
                : "35px",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          maxWidth={isFocusMode ? "auto" : "935px"}
          width={["100%", "100%", isFocusMode ? "auto" : "100%"]}
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
                    initialValue={editorstore.get()?.session?.content?.data}
                    onChange={(content) => {
                      if (!content || content === "<p><br></pr>") return;

                      setSession((state) => {
                        state.session.content = {
                          type: "tiny",
                          data: content,
                        };
                      });
                    }}
                    changeInterval={100}
                    onWordCountChanged={updateWordCount}
                    onInit={(editor) => {
                      editor.focus();
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
        </AnimatedFlex>
      </Flex>
      <Properties noteId={noteId} />
    </Flex>
  );
}
export default Editor;
