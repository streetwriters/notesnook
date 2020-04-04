import React, { useEffect, useRef } from "react";
import "./editor.css";
import ReactQuill from "./react-quill";
import { Flex, Box } from "rebass";
import Properties from "../properties";
import { useStore, SESSION_STATES } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import EditorMenu from "./editormenu";
import Header from "./header";

function Editor() {
  const id = useStore((store) => store.session.id);
  const delta = useStore((store) => store.session.content.delta);
  const sessionState = useStore((store) => store.session.state);
  const setSession = useStore((store) => store.setSession);
  const saveSession = useStore((store) => store.saveSession);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const quillRef = useRef();

  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, []);

  return (
    <Animated.Flex
      width={["0%", "0%", "100%"]}
      initial={{ marginRight: 0 }}
      animate={{
        marginRight: isFocusMode ? "25%" : 0,
      }}
      transition={{ duration: 0.3, ease: "easeIn" }}
      sx={{
        marginLeft: isFocusMode ? "25%" : 0,
        position: "relative",
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
        <Box id="toolbar" display={["none", "flex", "flex"]} />
        <EditorMenu quill={quillRef.current && quillRef.current.quill} />
        <ReactQuill
          id="quill"
          ref={quillRef}
          refresh={sessionState === SESSION_STATES.new}
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
      {id ? <Properties /> : null}
    </Animated.Flex>
  );
}
export default Editor;
