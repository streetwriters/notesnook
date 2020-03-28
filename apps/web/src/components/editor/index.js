import React, { useEffect, useRef } from "react";
import "./editor.css";
import ReactQuill from "./react-quill";
import { Flex, Box, Text } from "rebass";
import TitleBox from "./title-box";
import Properties from "../properties";
import { useStore, SESSION_STATES } from "../../stores/editor-store";
import { timeConverter } from "../../utils/time";
import { countWords } from "../../utils/string";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import EditorMenu from "./editormenu";

const TextSeperator = () => {
  return (
    <Text as="span" mx={1} mt={"-3px"} fontSize="20px">
      •
    </Text>
  );
};

function Editor() {
  const title = useStore(store => store.session.title);
  const dateEdited = useStore(store => store.session.dateEdited);
  const id = useStore(store => store.session.id);
  const text = useStore(store => store.session.content.text);
  const isSaving = useStore(store => store.session.isSaving);
  const delta = useStore(store => store.session.content.delta);
  const sessionState = useStore(store => store.session.state);
  const setSession = useStore(store => store.setSession);
  const saveSession = useStore(store => store.saveSession);
  const newSession = useStore(store => store.newSession);
  const reopenLastSession = useStore(store => store.reopenLastSession);
  const isFocusMode = useAppStore(store => store.isFocusMode);
  const hideProperties = useAppStore(store => store.hideProperties);
  const quillRef = useRef();

  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, []);

  useEffect(() => {
    reopenLastSession();
  }, [reopenLastSession]);

  return (
    <Animated.Flex
      width={["0%", "0%", "100%"]}
      initial={{ marginRight: 0 }}
      animate={{
        marginRight: isFocusMode ? "25%" : 0
      }}
      transition={{ duration: 0.3, ease: "easeIn" }}
      sx={{
        marginLeft: isFocusMode ? "25%" : 0,
        position: "relative"
      }}
    >
      <Flex
        variant="columnFill"
        className="editor"
        onFocus={() => {
          //hideProperties();
        }}
      >
        <TitleBox
          shouldFocus={sessionState === SESSION_STATES.new}
          title={title}
          setTitle={title =>
            setSession(state => {
              state.session.title = title;
            })
          }
          sx={{
            paddingTop: 2,
            paddingBottom: 0
          }}
        />
        <Text
          fontSize={"subBody"}
          mx={2}
          color="fontTertiary"
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: dateEdited || text.length || id.length ? 0 : 2,
            marginBottom: dateEdited || text.length || id.length ? 2 : 0
          }}
        >
          {dateEdited > 0 && (
            <>
              {timeConverter(dateEdited)}
              <TextSeperator />
            </>
          )}
          {text.length > 0 && (
            <>
              {countWords(text) + " words"}
              <TextSeperator />
            </>
          )}
          {id && id.length > 0 && <>{isSaving ? "Saving" : "Saved"}</>}
        </Text>
        <Box id="toolbar" display={["none", "flex", "flex"]} />
        <EditorMenu quill={quillRef.current && quillRef.current.quill} />
        <ReactQuill
          ref={quillRef}
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
                delta: { ops: editor.getContents().ops },
                text: editor.getText()
              };
            });
          }}
        />
      </Flex>
      {id && <Properties />}
    </Animated.Flex>
  );
}

export default Editor;
