import React, { useEffect, useRef, Suspense, useCallback } from "react";
import { Flex } from "rebass";
import Properties from "../properties";
import {
  useStore,
  SESSION_STATES,
  store as editorstore,
} from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import Header from "./header";
import useMobile from "../../utils/use-mobile";
import useTablet from "../../utils/use-tablet";
import Toolbar from "./toolbar";
import EditorLoading from "./loading";
import { db } from "../../common/db";

const ReactMCE = React.lazy(() => import("./tinymce"));

function Editor({ noteId, nonce }) {
  const editorRef = useRef();
  const sessionState = useStore((store) => store.session.state);
  const sessionNonce = useStore((store) => store.session.nonce);
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

  useEffect(() => {
    if (!editorRef.current?.editor) return;
    (async () => {
      await startSession(noteId);
    })();
  }, [startSession, noteId, nonce]);

  useEffect(() => {
    if (sessionState === SESSION_STATES.new) {
      editorstore.set((state) => (state.session.state = SESSION_STATES.stale));
      const {
        id,
        content: { data },
      } = editorstore.get().session;
      const editor = editorRef.current?.editor;
      if (!editor) return;
      async function setContents() {
        // NOTE: workaround to not fire onEditorChange event on content load
        editor.isLoading = true;
        editor.setContent(data, { format: "html" });

        editor.undoManager.reset();
        editor.setDirty(false);

        await db.attachments.download(id);
      }

      if (!isMobile) editor.focus();

      setContents();
      editor.on("init", setContents);
      return () => {
        editor.off("init", setContents);
      };
    }
  }, [editorRef, isMobile, contentType, sessionState, sessionNonce]);

  return (
    <Flex
      flexDirection="column"
      flex={1}
      sx={{
        position: "relative",
        alignSelf: "stretch",
        overflow: "hidden",
      }}
    >
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
        <Animated.Flex
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

          <Suspense fallback={<EditorLoading />}>
            {contentType === "tiny" ? (
              <>
                <ReactMCE
                  editorRef={editorRef}
                  onFocus={() => toggleProperties(false)}
                  onSave={saveSession}
                  onChange={(content) => {
                    if (!content.length) content = "<p><br></pr>";
                    setSession((state) => {
                      state.session.content = {
                        type: "tiny",
                        data: content,
                      };
                    });
                  }}
                  changeInterval={500}
                  onWordCountChanged={updateWordCount}
                  onInit={async () => {
                    await startSession(noteId);
                  }}
                />
              </>
            ) : null}
          </Suspense>
        </Animated.Flex>
      </Flex>
      <Properties />
    </Flex>
  );
}
export default Editor;
