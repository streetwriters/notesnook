import React, { useEffect, useMemo, useRef, Suspense } from "react";
//import ReactQuill from "./react-quill";
import { Flex } from "rebass";
import Properties from "../properties";
import {
  useStore,
  SESSION_STATES,
  store as editorstore,
} from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import Animated from "../animated";
import Header from "./header";
import useMobile from "../../utils/use-mobile";
import useTablet from "../../utils/use-tablet";
import { SUBSCRIPTION_STATUS } from "../../common";
import Toolbar from "./toolbar";
import ObservableArray from "../../utils/observablearray";
import Banner from "../banner";
import EditorLoading from "./loading";

const ReactQuill = React.lazy(() => import("./react-quill"));

function Editor(props) {
  const sessionState = useStore((store) => store.session.state);
  const sessionId = useStore((store) => store.session.id);
  const contentType = useStore((store) => store.session.content?.type);
  const setSession = useStore((store) => store.setSession);
  const saveSession = useStore((store) => store.saveSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const updateWordCount = useStore((store) => store.updateWordCount);
  const init = useStore((store) => store.init);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isMobile = useMobile();
  const isTablet = useTablet();

  const isTrial = useUserStore(
    (store) => store.user?.subscription?.status === SUBSCRIPTION_STATUS.TRIAL
  );
  const isLoggedin = useUserStore((store) => store.isLoggedIn);
  const editorMargins = useMemo(() => {
    if (isMobile || isTablet) return "0%";
    else return "10px";
  }, [isTablet, isMobile]);

  const quillRef = useRef();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (contentType !== "delta" || !quillRef || !quillRef.current) return;

    if (sessionState === SESSION_STATES.new) {
      editorstore.set((state) => (state.session.state = SESSION_STATES.stale));
      const {
        content: { data },
      } = editorstore.get().session;

      const { quill } = quillRef.current;
      quill.setContents(data, "init");
      // quill.history.clear();
      quill.history.stack = {
        undo: new ObservableArray("undo"),
        redo: new ObservableArray("redo"),
      };

      const record = quill.history.record.bind(quill.history);
      quill.history.record = function (changeDelta, oldDelta) {
        record(changeDelta, oldDelta);
        quill.history.stack.redo = new ObservableArray("redo");
      };

      if (!data || !data.length) return;
      const text = quill.getText();
      quill.setSelection(text.length, 0, "init");
    }
  }, [sessionState, quillRef, contentType, sessionId]);

  return (
    <Flex
      flexDirection="column"
      sx={{
        position: "relative",
        alignSelf: isFocusMode ? "center" : "stretch",
        overflow: "hidden",
      }}
      flex="1 1 auto"
    >
      {isMobile && <Banner />}
      <Toolbar quill={quillRef.current?.quill} />
      <Flex
        variant="columnFill"
        className="editorScroll"
        flexDirection="column"
        overflow="hidden"
        overflowY="auto"
      >
        <Animated.Flex
          variant="columnFill"
          className="editor"
          sx={{ mx: [0, 0, editorMargins], alignSelf: "center" }}
          animate={{
            marginRight: isFocusMode ? "25%" : editorMargins,
            marginLeft: isFocusMode ? "25%" : editorMargins,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          maxWidth={"900px"}
          mt={[0, 0, 0]}
        >
          <Header />
          {contentType === "delta" && (
            <Suspense fallback={<EditorLoading />}>
              <ReactQuill
                id="quill"
                ref={quillRef}
                refresh={sessionState === SESSION_STATES.new}
                isSimple={!isLoggedin || (isLoggedin && !isTrial)}
                isFocusMode={isFocusMode}
                onFocus={() => {
                  toggleProperties(false);
                }}
                placeholder="Type anything here"
                container=".editor"
                scrollContainer=".editorScroll"
                onSave={() => {
                  saveSession();
                }}
                changeInterval={500}
                onWordCountChanged={updateWordCount}
                onChange={() => {
                  const { quill } = quillRef.current;
                  const delta = quill.getContents().ops;
                  setSession((state) => {
                    state.session.content = {
                      type: "delta",
                      data: delta,
                    };
                  });
                }}
              />
            </Suspense>
          )}
        </Animated.Flex>
      </Flex>
      <Properties />
    </Flex>
  );
}
export default Editor;
