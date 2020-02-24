import React, { useEffect } from "react";
import "./editor.css";
import ReactQuill from "./react-quill";
import { Flex, Box } from "rebass";
import TitleBox from "./title-box";
import Properties from "../properties";
import { useStore, SESSION_STATES } from "../../stores/editor-store";

function Editor() {
  const title = useStore(store => store.session.title);
  const delta = useStore(store => store.session.content.delta);
  const sessionState = useStore(store => store.session.state);
  const setSession = useStore(store => store.setSession);
  const saveSession = useStore(store => store.saveSession);
  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, []);

  return (
    <Flex width={["0%", "0%", "100%"]} sx={{ position: "relative" }}>
      <Flex className="editor" flex="1 1 auto" flexDirection="column">
        <TitleBox
          shouldFocus={sessionState === SESSION_STATES.new}
          title={title}
          setTitle={title =>
            setSession(state => {
              state.session.title = title;
            })
          }
        />
        <Box id="toolbar" display={["none", "flex", "flex"]} />
        <ReactQuill
          refresh={sessionState === SESSION_STATES.new}
          initialContent={delta}
          placeholder="Type anything here"
          container=".editor"
          onSave={() => {
            saveSession();
          }}
          onChange={editor => {
            setSession(state => {
              state.session.content = {
                delta: editor.getContents(),
                text: editor.getText()
              };
            });
          }}
        />
      </Flex>
      <Properties />
    </Flex>
  );
}

export default Editor;
