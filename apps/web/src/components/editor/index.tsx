import { useEffect, useCallback, useState } from "react";
import { Box, Button, Flex, Text } from "rebass";
import Properties from "../properties";
import { useStore, store as editorstore } from "../../stores/editor-store";
import Toolbar from "./toolbar";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { FlexScrollContainer } from "../scroll-container";
import { formatDate } from "notes-core/utils/date";
import { debounce, debounceWithId } from "../../utils/debounce";
import { CharacterCounter } from "./types";
import Tiptap from "./tiptap";
import Header from "./header";

function updateWordCount(counter?: CharacterCounter) {
  AppEventManager.publish(
    AppEvents.UPDATE_WORD_COUNT,
    counter ? counter.words() : 0
  );
}

function onEditorChange(noteId: string, sessionId: string, content: string) {
  if (!content) return;

  editorstore.get().saveSessionContent(noteId, sessionId, {
    type: "tiny",
    data: content,
  });
}
const debouncedUpdateWordCount = debounce(updateWordCount, 1000);
const debouncedOnEditorChange = debounceWithId(onEditorChange, 100);

export default function EditorManager({
  noteId,
  nonce,
}: {
  noteId: string | number;
  nonce?: string;
}) {
  const isNewSession = !!nonce && noteId === 0;
  const isOldSession = !nonce && !!noteId;

  const [content, setContent] = useState<string>("");
  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isPreviewMode = useStore(
    (store) => store.session.sessionType === "preview"
  );
  const isReadonly = useStore(
    (store) => store.session.readonly || isPreviewMode
  );
  // TODO move this somewhere more appropriate
  // const init = useStore((store) => store.init);

  useEffect(() => {
    if (!isNewSession) return;
    editorstore.newSession(nonce);
    setContent("");
  }, [isNewSession, nonce]);

  useEffect(() => {
    (async function () {
      const content = await editorstore.get().getSessionContent();
      setContent(content?.data);
    })();
  }, [isPreviewMode]);

  useEffect(() => {
    if (!isOldSession) return;

    (async function () {
      await editorstore.openSession(noteId);

      let content = await editorstore.get().getSessionContent();
      setContent(content?.data);
    })();
  }, [noteId, isOldSession]);

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
      {isPreviewMode && <PreviewModeNotice />}
      <Editor
        content={content}
        readonly={isReadonly}
        onRequestFocus={() => toggleProperties(false)}
      />
      {arePropertiesVisible && <Properties />}
    </Flex>
  );
}

type EditorProps = {
  readonly?: boolean;
  focusMode?: boolean;
  content: string;
  onRequestFocus?: () => void;
};
function Editor({ content, readonly, focusMode, onRequestFocus }: EditorProps) {
  useEffect(() => {
    console.log("new contentn");
  }, [content]);

  useEffect(() => {
    console.log("rerender");
  }, []);

  return (
    <>
      <Toolbar />
      <FlexScrollContainer
        className="editorScroll"
        style={{}}
        viewStyle={{ display: "flex", flexDirection: "column" }}
      >
        <Flex
          variant="columnFill"
          className="editor"
          sx={{
            alignSelf: ["stretch", focusMode ? "center" : "stretch", "center"],
          }}
          maxWidth={focusMode ? "min(100%, 850px)" : "935px"}
          width="100%"
          px={[2, 2, 35]}
          onClick={onRequestFocus}
          // mt={[2, 2, 25]}
        >
          <Box
            id="editorToolbar"
            sx={{
              display: readonly ? "none" : "flex",
              bg: "background",
              position: "sticky",
              top: 0,
              mb: 1,
              zIndex: 2,
            }}
          />
          <Header readonly={readonly} />
          <Tiptap
            readonly={readonly}
            toolbarContainerId="editorToolbar"
            content={content}
            onChange={(content, counter) => {
              const { id, sessionId } = editorstore.get().session;
              debouncedOnEditorChange(sessionId, id, sessionId, content);
              if (counter) debouncedUpdateWordCount(counter);
            }}
          />
        </Flex>
      </FlexScrollContainer>
      {/* TODO <Box
        id="editorToolbar"
        sx={{
          display: readonly ? "none" : "flex",
          bg: "background",
          position: "sticky",
          top: 0,
          mb: 1,
          zIndex: 2,
          px: [2, 2, 35],
        }}
      /> */}
    </>
  );
}

function PreviewModeNotice() {
  const disablePreviewMode = useCallback(async (cancelled) => {
    const { id, sessionId, content } = editorstore.get().session;
    if (!cancelled) {
      await editorstore.saveSessionContent(id, sessionId, content);
    }
    await editorstore.openSession(id, true);
  }, []);

  return (
    <Flex
      bg="bgSecondary"
      p={2}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Flex flexDirection={"column"} mr={4}>
        <Text variant={"subtitle"}>Preview</Text>
        <Text variant={"body"}>
          You are previewing note version edited from{" "}
          {formatDate(editorstore.get().session.dateCreated)} to{" "}
          {formatDate(editorstore.get().session.dateEdited)}.
        </Text>
      </Flex>
      <Flex>
        <Button
          data-test-id="editor-notice-cancel"
          variant={"secondary"}
          mr={1}
          px={4}
          onClick={() => disablePreviewMode(true)}
        >
          Cancel
        </Button>
        <Button
          data-test-id="editor-notice-action"
          px={4}
          onClick={async () => {
            await disablePreviewMode(false);
            await editorstore.get().saveSession();
          }}
        >
          Restore
        </Button>
      </Flex>
    </Flex>
  );
}
