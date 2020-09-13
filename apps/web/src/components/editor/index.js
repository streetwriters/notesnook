import React, { useEffect, useRef } from "react";
import "./editor.css";
import ReactQuill from "./react-quill";
import { Flex } from "rebass";
import Properties from "../properties";
import { useStore, SESSION_STATES } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import Animated from "../animated";
import EditorMenu from "./editormenu";
import Header from "./header";
import { useHashParam } from "../../utils/useHashParam";
import SplitEditor from "../spliteditor";

function Editor() {
  const delta = useStore((store) => store.session.content.delta);
  const sessionState = useStore((store) => store.session.state);
  const setSession = useStore((store) => store.setSession);
  const saveSession = useStore((store) => store.saveSession);
  const init = useStore((store) => store.init);
  //const openSession = useStore((store) => store.openSession);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const isTrial = useUserStore(
    (store) => store.user.notesnook?.subscription?.isTrial
  );
  const quillRef = useRef();
  const [diff] = useHashParam("diff");

  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (sessionState === SESSION_STATES.new) {
      const { quill } = quillRef.current;
      quill.setContents(delta, "init");
      quill.history.clear();
      if (!delta.ops || !delta.ops.length) return;
      const text = quill.getText();
      quill.setSelection(text.length, 0, "init");
    }
  }, [sessionState, delta]);

  if (diff) return <SplitEditor diffId={diff} />;
  return (
    <Animated.Flex
      width={["0%", "0%", "100%"]}
      initial={{ width: "100%" }}
      animate={{
        width: isFocusMode ? "55%" : "100%",
      }}
      transition={{ duration: 0.3, ease: "easeIn" }}
      sx={{
        position: "relative",
        alignSelf: isFocusMode ? "center" : "stretch",
        overflow: "hidden",
      }}
      flex="1 1 auto"
    >
      <Flex
        variant="columnFill"
        className="editor"
        onFocus={() => {
          //hideProperties();
        }}
      >
        <Header />
        <Flex id="toolbar" />
        <EditorMenu quill={quillRef.current && quillRef.current.quill} />
        <ReactQuill
          id="quill"
          ref={quillRef}
          refresh={sessionState === SESSION_STATES.new}
          isSimple={isTrial}
          initialContent={delta}
          placeholder="Type anything here"
          container=".editor"
          onSave={() => {
            saveSession();
          }}
          onChange={(editor) => {
            setSession((state) => {
              state.session.content = {
                delta: { ops: editor.getContents().ops },
                text: editor.getText(),
              };
            });
          }}
        />
      </Flex>
      <Properties />
    </Animated.Flex>
  );
}
export default Editor;
