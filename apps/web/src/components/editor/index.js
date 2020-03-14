import React, { useEffect, useRef } from "react";
import "./editor.css";
import ReactQuill from "./react-quill";
import { Flex, Box, Text } from "rebass";
import TitleBox from "./title-box";
import * as Icon from "react-feather";
import Properties from "../properties";
import { useStore, SESSION_STATES } from "../../stores/editor-store";
import { timeConverter } from "../../utils/time";
import { countWords } from "../../utils/string";
import { useTheme } from "emotion-theming";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import { Input } from "@rebass/forms";

const TextSeperator = () => {
  const theme = useTheme();
  return (
    <Text as="span" mx={1}>
      <Icon.Circle size={6} fill={theme.colors.fontTertiary} />
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
  const isFocusModeEnabled = useAppStore(store => store.isFocusModeEnabled);
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
        marginRight: isFocusModeEnabled ? "25%" : 0
      }}
      transition={{ duration: 0.3, ease: "easeIn" }}
      sx={{
        marginLeft: isFocusModeEnabled ? "25%" : 0,
        position: "relative"
      }}
    >
      <Flex
        className="editor"
        flex="1 1 auto"
        flexDirection="column"
        onFocus={() => {
          hideProperties();
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
        <Flex
          sx={{
            borderBottom: "1px solid",
            borderColor: "border",
            fontSize: 13
          }}
        >
          <Text variant="menu" ml={1} onClick={() => newSession()}>
            <span style={{ textDecoration: "underline" }}>N</span>ew
          </Text>
          <Text
            variant="menu"
            onClick={() => quillRef.current.quill.history.undo()}
          >
            Undo
          </Text>
          <Text
            variant="menu"
            onClick={() => quillRef.current.quill.history.redo()}
          >
            Redo
          </Text>
          <Text variant="menu" onClick={() => saveSession()}>
            <span style={{ textDecoration: "underline" }}>S</span>ave
          </Text>
          <Text variant="menu">
            <span style={{ textDecoration: "underline" }}>E</span>xport
          </Text>
        </Flex>
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
                delta: editor.getContents(),
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
