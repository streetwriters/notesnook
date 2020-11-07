import React, { useEffect, useRef } from "react";
import "./editor.css";
import ReactQuill from "./react-quill";
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
import EditorMenu from "./editormenu";
import Header from "./header";
import { useHashParam } from "../../utils/useHashParam";
import SplitEditor from "../spliteditor";
import Unlock from "../unlock";
import RouteContainer from "../route-container";
import useMobile from "../../utils/use-mobile";
import { SUBSCRIPTION_STATUS } from "../../common";

function Editor() {
  const sessionState = useStore((store) => store.session.state);
  const contentType = useStore((store) => store.session.content?.type);
  const setSession = useStore((store) => store.setSession);
  const saveSession = useStore((store) => store.saveSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const updateWordCount = useStore((store) => store.updateWordCount);
  const init = useStore((store) => store.init);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isMobile = useMobile();
  const isTrial = useUserStore(
    (store) => store.user?.subscription?.status === SUBSCRIPTION_STATUS.TRIAL
  );
  const isLoggedin = useUserStore((store) => store.isLoggedIn);

  const quillRef = useRef();
  const [diff] = useHashParam("diff");
  const [unlock] = useHashParam("unlock");

  useEffect(() => {
    if (contentType !== "delta") return;
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, [contentType]);

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
      quill.history.clear();
      if (!data || !data.length) return;
      const text = quill.getText();
      quill.setSelection(text.length, 0, "init");
    }
  }, [sessionState, quillRef, contentType]);

  if (unlock)
    return (
      <RouteContainer
        onlyBackButton={isMobile}
        route={<Unlock noteId={unlock} />}
      />
    );
  if (diff) return <SplitEditor diffId={diff} />;
  return (
    <Animated.Flex
      width={["0%", "0%", "100%"]}
      initial={{ width: "100%" }}
      animate={{
        width: isFocusMode ? "55%" : "100%",
      }}
      transition={{ duration: 0.5, ease: "easeIn" }}
      sx={{
        position: "relative",
        alignSelf: isFocusMode ? "center" : "stretch",
        overflow: "hidden",
      }}
      flex="1 1 auto"
    >
      <Flex variant="columnFill" className="editor">
        <Header />
        <Flex id="toolbar" />
        <EditorMenu quill={quillRef.current?.quill} />
        {contentType === "delta" && (
          <ReactQuill
            id="quill"
            ref={quillRef}
            refresh={sessionState === SESSION_STATES.new}
            isSimple={!isLoggedin || (isLoggedin && !isTrial)}
            onFocus={() => {
              toggleProperties(false);
            }}
            placeholder="Type anything here"
            container=".editor"
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
        )}
      </Flex>
      <Properties />
    </Animated.Flex>
  );
}
export default Editor;
